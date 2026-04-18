import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = path.resolve(import.meta.dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const routesRoot = path.join(srcRoot, 'routes');
const outputFile = path.join(
  srcRoot,
  'constants',
  'resourceApiProfile.generated.ts',
);
const supportedExtensions = ['.ts', '.tsx'];
const excludedApiResources = new Set([
  '/passport/current/user',
  '/passport/current/permission',
  '/passport/current_info',
  '/passport/refresh_token',
  '/passport/password_login',
  '/passport/register',
  '/passport/logout',
  '/system/message/unread-count',
]);

const sourceFileCache = new Map();
const fileInfoCache = new Map();
const pageApiCache = new Map();

const permissionResourceMap = loadPermissionResourceMap();
const apiIndex = buildApiIndex();
const routeEntries = collectRouteEntries(routesRoot);
const pageResourceApiMap = new Map();
const buttonResourceApiMap = new Map();

for (const routeEntry of routeEntries) {
  const pageApiResources = collectPageApiResources(routeEntry.filePath);
  if (pageApiResources.length > 0) {
    pageResourceApiMap.set(routeEntry.routePath, pageApiResources);
  }
  mergeButtonResourceApiMap(buttonResourceApiMap, routeEntry.filePath);
}

fs.writeFileSync(
  outputFile,
  buildGeneratedContent(pageResourceApiMap, buttonResourceApiMap),
  'utf8',
);
console.log(`已生成资源画像：${path.relative(projectRoot, outputFile)}`);

function buildGeneratedContent(pageMap, buttonMap) {
  return `/**\n * 该文件由 scripts/generate-resource-api-profile.mjs 自动生成。\n * 请勿手动修改。\n */\n\nexport const GENERATED_MENU_RESOURCE_API_PROFILE = ${formatProfileMap(pageMap)} as const;\n\nexport const GENERATED_BUTTON_RESOURCE_API_PROFILE = ${formatProfileMap(buttonMap)} as const;\n`;
}

function formatProfileMap(profileMap) {
  const entries = Array.from(profileMap.entries()).sort((left, right) => {
    return left[0].localeCompare(right[0]);
  });

  if (entries.length === 0) {
    return '{}';
  }

  const lines = entries.map(([key, resources]) => {
    const sortedResources = Array.from(new Set(resources))
      .filter((item) => !excludedApiResources.has(item))
      .sort();
    const resourceLines = sortedResources
      .map((item) => `    ${JSON.stringify(item)}`)
      .join(',\n');
    return `  ${JSON.stringify(key)}: [\n${resourceLines}\n  ]`;
  });

  return `{
${lines.join(',\n')}
}`;
}

function buildApiIndex() {
  const apiEntryFile = path.join(srcRoot, 'api', 'index.ts');
  const sourceFile = getSourceFile(apiEntryFile);
  const aliasToFileMap = new Map();

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) {
      return;
    }
    const importClause = node.importClause;
    if (!importClause?.namedBindings) {
      return;
    }
    if (!ts.isNamespaceImport(importClause.namedBindings)) {
      return;
    }

    const aliasName = importClause.namedBindings.name.text;
    const importPath = stripQuotes(node.moduleSpecifier.getText(sourceFile));
    const resolvedFilePath = resolveImportPath(apiEntryFile, importPath);
    if (!resolvedFilePath) {
      return;
    }
    aliasToFileMap.set(aliasName, resolvedFilePath);
  });

  const result = new Map();
  aliasToFileMap.forEach((filePath, aliasName) => {
    result.set(aliasName, collectApiModuleExports(filePath));
  });
  return result;
}

function collectApiModuleExports(filePath) {
  const sourceFile = getSourceFile(filePath);
  const exportMap = new Map();

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    const isExported = node.modifiers?.some((item) => {
      return item.kind === ts.SyntaxKind.ExportKeyword;
    });
    if (!isExported) {
      return;
    }

    node.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        return;
      }
      const apiResources = collectDirectRequestResources(declaration.initializer);
      if (apiResources.length === 0) {
        return;
      }
      exportMap.set(declaration.name.text, apiResources);
    });
  });

  return exportMap;
}

function collectDirectRequestResources(node) {
  const resourceSet = new Set();

  const visit = (currentNode) => {
    if (ts.isCallExpression(currentNode)) {
      if (
        ts.isIdentifier(currentNode.expression) &&
        currentNode.expression.text === 'request'
      ) {
        const resource = getStringValue(currentNode.arguments[0]);
        if (resource) {
          resourceSet.add(resource);
        }
      }
    }
    ts.forEachChild(currentNode, visit);
  };

  visit(node);
  return Array.from(resourceSet);
}

function loadPermissionResourceMap() {
  const permissionFile = path.join(srcRoot, 'constants', 'permission.ts');
  const sourceFile = getSourceFile(permissionFile);
  const result = new Map();

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    const isExported = node.modifiers?.some((item) => {
      return item.kind === ts.SyntaxKind.ExportKeyword;
    });
    if (!isExported) {
      return;
    }

    node.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name)) {
        return;
      }
      if (declaration.name.text !== 'PERMISSION_RESOURCE') {
        return;
      }
      if (!ts.isObjectLiteralExpression(declaration.initializer)) {
        return;
      }

      declaration.initializer.properties.forEach((property) => {
        if (!ts.isPropertyAssignment(property)) {
          return;
        }
        const key = getPropertyName(property.name);
        const value = getStringValue(property.initializer);
        if (!key || !value) {
          return;
        }
        result.set(key, value);
      });
    });
  });

  return result;
}

function collectRouteEntries(directoryPath) {
  const entries = [];

  walkDirectory(directoryPath, (filePath) => {
    if (!isSupportedSourceFile(filePath) || shouldIgnoreSourceFile(filePath)) {
      return;
    }

    const sourceFile = getSourceFile(filePath);
    let routePath = null;

    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isVariableStatement(node)) {
        return;
      }
      const isExported = node.modifiers?.some((item) => {
        return item.kind === ts.SyntaxKind.ExportKeyword;
      });
      if (!isExported) {
        return;
      }

      node.declarationList.declarations.forEach((declaration) => {
        if (!ts.isIdentifier(declaration.name)) {
          return;
        }
        if (declaration.name.text !== 'Route') {
          return;
        }
        if (!ts.isCallExpression(declaration.initializer)) {
          return;
        }

        const routeFactoryCall = declaration.initializer.expression;
        if (!ts.isCallExpression(routeFactoryCall)) {
          return;
        }
        if (!ts.isIdentifier(routeFactoryCall.expression)) {
          return;
        }
        if (routeFactoryCall.expression.text !== 'createFileRoute') {
          return;
        }

        routePath = normalizeRoutePath(getStringValue(routeFactoryCall.arguments[0]));
      });
    });

    if (routePath) {
      entries.push({ filePath, routePath });
    }
  });

  return entries;
}

function collectPageApiResources(filePath) {
  const cachedValue = pageApiCache.get(filePath);
  if (cachedValue) {
    return cachedValue;
  }

  const fileInfo = getFileInfo(filePath);
  const resourceSet = new Set(fileInfo.pageApiResources);

  fileInfo.pageChildFiles.forEach((childFile) => {
    collectPageApiResources(childFile).forEach((resource) => {
      resourceSet.add(resource);
    });
  });

  const result = Array.from(resourceSet)
    .filter((item) => !excludedApiResources.has(item))
    .sort();
  pageApiCache.set(filePath, result);
  return result;
}

function mergeButtonResourceApiMap(targetMap, filePath, visited = new Set()) {
  if (visited.has(filePath)) {
    return;
  }
  visited.add(filePath);

  const fileInfo = getFileInfo(filePath);
  fileInfo.buttonApiResources.forEach((resources, permissionCode) => {
    const resourceSet = new Set(targetMap.get(permissionCode) ?? []);

    resources.forEach((resource) => {
      if (!excludedApiResources.has(resource)) {
        resourceSet.add(resource);
      }
    });

    const childFiles = fileInfo.buttonChildFiles.get(permissionCode) ?? [];
    childFiles.forEach((childFile) => {
      collectPageApiResources(childFile).forEach((resource) => {
        if (!excludedApiResources.has(resource)) {
          resourceSet.add(resource);
        }
      });
    });

    if (resourceSet.size > 0) {
      targetMap.set(permissionCode, Array.from(resourceSet).sort());
    }
  });

  fileInfo.pageChildFiles.forEach((childFile) => {
    mergeButtonResourceApiMap(targetMap, childFile, visited);
  });
}

function getFileInfo(filePath) {
  const cachedValue = fileInfoCache.get(filePath);
  if (cachedValue) {
    return cachedValue;
  }

  const sourceFile = getSourceFile(filePath);
  const localImportMap = new Map();
  const apiAliasSet = new Set();

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node) || !node.importClause) {
      return;
    }

    const importPath = stripQuotes(node.moduleSpecifier.getText(sourceFile));
    if (importPath === '@/api') {
      if (
        node.importClause.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        node.importClause.namedBindings.elements.forEach((element) => {
          apiAliasSet.add(element.name.text);
        });
      }
      return;
    }

    const resolvedFilePath = resolveImportPath(filePath, importPath);
    if (!resolvedFilePath || shouldIgnoreSourceFile(resolvedFilePath)) {
      return;
    }

    if (node.importClause.name) {
      localImportMap.set(node.importClause.name.text, resolvedFilePath);
    }

    const namedBindings = node.importClause.namedBindings;
    if (!namedBindings) {
      return;
    }
    if (ts.isNamespaceImport(namedBindings)) {
      localImportMap.set(namedBindings.name.text, resolvedFilePath);
      return;
    }
    if (ts.isNamedImports(namedBindings)) {
      namedBindings.elements.forEach((element) => {
        localImportMap.set(element.name.text, resolvedFilePath);
      });
    }
  });

  const pageApiSet = new Set();
  const pageChildSet = new Set();
  const buttonApiMap = new Map();
  const buttonChildMap = new Map();

  visitNode(sourceFile, { currentPermissionCode: null });

  const info = {
    pageApiResources: Array.from(pageApiSet).sort(),
    pageChildFiles: Array.from(pageChildSet).sort(),
    buttonApiResources: new Map(
      Array.from(buttonApiMap.entries()).map(([permissionCode, resourceSet]) => {
        return [permissionCode, Array.from(resourceSet).sort()];
      }),
    ),
    buttonChildFiles: new Map(
      Array.from(buttonChildMap.entries()).map(([permissionCode, childSet]) => {
        return [permissionCode, Array.from(childSet).sort()];
      }),
    ),
  };

  fileInfoCache.set(filePath, info);
  return info;

  function visitNode(node, context) {
    let nextContext = context;

    if (ts.isJsxElement(node)) {
      nextContext = createJsxContext(node.openingElement, context);
    }

    if (ts.isJsxSelfClosingElement(node)) {
      nextContext = createJsxContext(node, context);
    }

    collectNodeApiResources(node, apiAliasSet).forEach((resource) => {
      addApiResource(nextContext.currentPermissionCode, resource);
    });

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'definePageApiDeps') {
        readPatchResources(node.arguments, apiAliasSet).forEach((resource) => {
          pageApiSet.add(resource);
        });
      }
    }

    ts.forEachChild(node, (child) => {
      visitNode(child, nextContext);
    });
  }

  function createJsxContext(jsxNode, context) {
    const permissionCode = readPermissionCode(jsxNode.attributes);
    const nextContext = {
      currentPermissionCode: permissionCode ?? context.currentPermissionCode,
    };

    readJsxPatchResources(jsxNode.attributes, apiAliasSet).forEach((resource) => {
      addApiResource(nextContext.currentPermissionCode, resource);
    });

    const referencedFile = resolveJsxTagFile(jsxNode.tagName, localImportMap);
    if (!referencedFile) {
      return nextContext;
    }

    if (nextContext.currentPermissionCode) {
      const childSet = buttonChildMap.get(nextContext.currentPermissionCode) ?? new Set();
      childSet.add(referencedFile);
      buttonChildMap.set(nextContext.currentPermissionCode, childSet);
      return nextContext;
    }

    pageChildSet.add(referencedFile);
    return nextContext;
  }

  function addApiResource(permissionCode, resource) {
    if (!resource || excludedApiResources.has(resource)) {
      return;
    }

    if (permissionCode) {
      const apiSet = buttonApiMap.get(permissionCode) ?? new Set();
      apiSet.add(resource);
      buttonApiMap.set(permissionCode, apiSet);
      return;
    }

    pageApiSet.add(resource);
  }
}

function collectNodeApiResources(node, apiAliasSet) {
  const resourceSet = new Set();

  if (ts.isCallExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === 'request') {
      const directResource = getStringValue(node.arguments[0]);
      if (directResource) {
        resourceSet.add(directResource);
      }
    }

    if (ts.isPropertyAccessExpression(node.expression)) {
      const moduleAlias = getLeftMostIdentifier(node.expression.expression);
      const functionName = node.expression.name.text;
      const resources = apiIndex.get(moduleAlias)?.get(functionName) ?? [];
      resources.forEach((resource) => {
        resourceSet.add(resource);
      });
    }
  }

  if (ts.isPropertyAccessExpression(node)) {
    const moduleAlias = getLeftMostIdentifier(node.expression);
    if (apiAliasSet.has(moduleAlias)) {
      const resources = apiIndex.get(moduleAlias)?.get(node.name.text) ?? [];
      resources.forEach((resource) => {
        resourceSet.add(resource);
      });
    }
  }

  return Array.from(resourceSet);
}

function readPatchResources(argumentsList, apiAliasSet) {
  const resourceSet = new Set();

  argumentsList.forEach((argument) => {
    collectNodeApiResources(argument, apiAliasSet).forEach((resource) => {
      resourceSet.add(resource);
    });

    if (ts.isArrayLiteralExpression(argument)) {
      argument.elements.forEach((element) => {
        const value = getStringValue(element);
        if (value) {
          resourceSet.add(value);
        }
      });
    }
  });

  return Array.from(resourceSet);
}

function readJsxPatchResources(attributes, apiAliasSet) {
  const resourceSet = new Set();

  attributes.properties.forEach((property) => {
    if (!ts.isJsxAttribute(property)) {
      return;
    }
    if (
      property.name.text !== 'apiDeps' &&
      property.name.text !== 'extraApiResources'
    ) {
      return;
    }
    if (!property.initializer || !ts.isJsxExpression(property.initializer)) {
      return;
    }

    const expression = property.initializer.expression;
    if (!expression) {
      return;
    }

    collectNodeApiResources(expression, apiAliasSet).forEach((resource) => {
      resourceSet.add(resource);
    });

    if (ts.isArrayLiteralExpression(expression)) {
      expression.elements.forEach((element) => {
        const value = getStringValue(element);
        if (value) {
          resourceSet.add(value);
        }
      });
    }
  });

  return Array.from(resourceSet);
}

function readPermissionCode(attributes) {
  for (const property of attributes.properties) {
    if (!ts.isJsxAttribute(property)) {
      continue;
    }
    if (property.name.text !== 'permissionCode') {
      continue;
    }
    if (!property.initializer || !ts.isJsxExpression(property.initializer)) {
      return null;
    }

    const expression = property.initializer.expression;
    if (!expression) {
      return null;
    }
    if (ts.isStringLiteral(expression)) {
      return expression.text;
    }
    if (ts.isPropertyAccessExpression(expression)) {
      const ownerName = getLeftMostIdentifier(expression.expression);
      if (ownerName === 'PERMISSION_RESOURCE') {
        return permissionResourceMap.get(expression.name.text) ?? null;
      }
    }
  }

  return null;
}

function resolveJsxTagFile(tagName, localImportMap) {
  if (!ts.isIdentifier(tagName)) {
    return null;
  }
  return localImportMap.get(tagName.text) ?? null;
}

function resolveImportPath(fromFile, importPath) {
  if (!importPath) {
    return null;
  }
  if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
    return null;
  }

  let basePath = importPath;
  if (importPath.startsWith('@/')) {
    basePath = path.join(srcRoot, importPath.slice(2));
  }
  if (importPath.startsWith('.')) {
    basePath = path.resolve(path.dirname(fromFile), importPath);
  }

  const candidates = [
    basePath,
    ...supportedExtensions.map((extension) => `${basePath}${extension}`),
    ...supportedExtensions.map((extension) =>
      path.join(basePath, `index${extension}`),
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function getSourceFile(filePath) {
  const cachedValue = sourceFileCache.get(filePath);
  if (cachedValue) {
    return cachedValue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  sourceFileCache.set(filePath, sourceFile);
  return sourceFile;
}

function walkDirectory(directoryPath, onFile) {
  fs.readdirSync(directoryPath, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, onFile);
      return;
    }
    onFile(fullPath);
  });
}

function isSupportedSourceFile(filePath) {
  return supportedExtensions.some((extension) => filePath.endsWith(extension));
}

function shouldIgnoreSourceFile(filePath) {
  if (!isSupportedSourceFile(filePath)) {
    return true;
  }
  if (filePath.includes(`${path.sep}__tests__${path.sep}`)) {
    return true;
  }
  if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) {
    return true;
  }
  if (filePath.endsWith('.styled.tsx')) {
    return true;
  }
  if (filePath.endsWith('.generated.ts')) {
    return true;
  }
  if (filePath.endsWith('routeTree.gen.ts')) {
    return true;
  }
  return false;
}

function getStringValue(node) {
  if (!node) {
    return null;
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

function getPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text;
  }
  return null;
}

function getLeftMostIdentifier(node) {
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  if (ts.isPropertyAccessExpression(node)) {
    return getLeftMostIdentifier(node.expression);
  }
  return '';
}

function normalizeRoutePath(routePath) {
  if (!routePath) {
    return null;
  }
  if (routePath !== '/' && routePath.endsWith('/')) {
    return routePath.slice(0, -1);
  }
  return routePath;
}

function stripQuotes(text) {
  return text.replace(/^['"]|['"]$/g, '');
}
