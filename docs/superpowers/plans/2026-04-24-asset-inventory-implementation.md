# 设备库存管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前多租户系统中新增设备库存管理能力，交付设备台账、位置管理、盘点任务，以及入库登记、领用、归还、调拨、盘点、报废六类生命周期动作。

**Architecture:** 后端新增独立 `mod-asset` 业务域，按现有仓库模式拆分为 `mod-asset-api` 与 `mod-asset-biz`，通过 Flyway 创建资产表、菜单与权限资源，并在 `boot` 中接入模块依赖；前端在 `admin-rsbuild` 中新增 `/asset/device`、`/asset/location`、`/asset/stocktake` 三个路由页面，复用 `KTable`、`KModal` 与现有权限资源接入模式，通过独立 API 模块与 TanStack Query 管理状态。

**Tech Stack:** React 18、TypeScript、TanStack Router、TanStack Query、Ant Design、Vitest、Spring Boot 3.5、MyBatis-Plus、PostgreSQL、Flyway、JUnit 5、Mockito

---

## 文件结构

- 后端模块与依赖
  - Create: `modelDesign/mod-asset/pom.xml`
  - Create: `modelDesign/mod-asset/mod-asset-api/pom.xml`
  - Create: `modelDesign/mod-asset/mod-asset-biz/pom.xml`
  - Modify: `modelDesign/pom.xml`
  - Modify: `modelDesign/boot/pom.xml`

- 后端领域模型与映射
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetDevice.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetCategory.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetLocation.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetTransaction.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetStocktakeTask.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetStocktakeItem.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetDeviceStatusEnum.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetTransactionTypeEnum.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetStocktakeStatusEnum.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetStocktakeItemResultEnum.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetDeviceMapper.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetCategoryMapper.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetLocationMapper.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetTransactionMapper.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetStocktakeTaskMapper.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetStocktakeItemMapper.java`

- 后端请求、响应、控制器、服务
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceListRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceCreateRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceEditRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceReceiveRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceReturnRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceTransferRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceScrapRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetLocationCreateRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetLocationEditRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetStocktakeCreateRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetStocktakeCheckRequest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetDeviceVo.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetLocationVo.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetStocktakeTaskVo.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetStocktakeDetailVo.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetOptionVo.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetDeviceController.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetLocationController.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetStocktakeController.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetOptionController.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetDeviceService.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetLocationService.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetStocktakeService.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetOptionService.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetTransactionWriteService.java`

- 后端测试
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetDeviceServiceTest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetLocationServiceTest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetStocktakeServiceTest.java`
  - Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/controller/AssetDeviceControllerTest.java`

- 数据迁移
  - Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260424101000__create_asset_tables.sql`
  - Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260424101100__seed_asset_menu.sql`
  - Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260424101200__seed_asset_permission_resources.sql`

- 前端 API、常量与测试
  - Create: `admin-rsbuild/src/api/modules/asset-device.ts`
  - Create: `admin-rsbuild/src/api/modules/asset-location.ts`
  - Create: `admin-rsbuild/src/api/modules/asset-stocktake.ts`
  - Modify: `admin-rsbuild/src/api/index.ts`
  - Modify: `admin-rsbuild/src/constants/permission.ts`
  - Modify: `admin-rsbuild/src/constants/queryKey/index.ts`
  - Create: `admin-rsbuild/src/constants/queryKey/asset.ts`
  - Modify: `admin-rsbuild/src/constants/permissionGroupShortcut.ts`
  - Modify: `admin-rsbuild/src/constants/resourceApiProfile.generated.ts`
  - Create: `admin-rsbuild/src/api/modules/__tests__/asset-device.test.ts`

- 前端页面
  - Create: `admin-rsbuild/src/routes/asset/device/index.tsx`
  - Create: `admin-rsbuild/src/routes/asset/device/#DeviceTable.tsx`
  - Create: `admin-rsbuild/src/routes/asset/device/#DeviceFormModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/device/#ReceiveModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/device/#ReturnModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/device/#TransferModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/device/#ScrapModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/location/index.tsx`
  - Create: `admin-rsbuild/src/routes/asset/location/#LocationTable.tsx`
  - Create: `admin-rsbuild/src/routes/asset/location/#LocationFormModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/stocktake/index.tsx`
  - Create: `admin-rsbuild/src/routes/asset/stocktake/#StocktakeTaskTable.tsx`
  - Create: `admin-rsbuild/src/routes/asset/stocktake/#StocktakeCreateModal.tsx`
  - Create: `admin-rsbuild/src/routes/asset/stocktake/#StocktakeDetailDrawer.tsx`

- 前端页面测试
  - Create: `admin-rsbuild/src/routes/asset/device/__tests__/DeviceTable.test.tsx`
  - Create: `admin-rsbuild/src/routes/asset/location/__tests__/LocationTable.test.tsx`
  - Create: `admin-rsbuild/src/routes/asset/stocktake/__tests__/StocktakeTaskTable.test.tsx`

### Task 1: 模块骨架、POM 依赖与数据库表迁移

**Files:**
- Create: `modelDesign/mod-asset/pom.xml`
- Create: `modelDesign/mod-asset/mod-asset-api/pom.xml`
- Create: `modelDesign/mod-asset/mod-asset-biz/pom.xml`
- Modify: `modelDesign/pom.xml`
- Modify: `modelDesign/boot/pom.xml`
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260424101000__create_asset_tables.sql`
- Test: `modelDesign/boot/src/test/resources/application-test.yml`

- [ ] **Step 1: 先写失败验证，锁定 boot 当前无法解析 `mod-asset` 依赖**

```bash
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
[ERROR] Could not find artifact io.github.modelDesign:mod-asset-biz
```

- [ ] **Step 2: 新增模块父 POM 与子模块 POM**

```xml
<!-- modelDesign/mod-asset/pom.xml -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>io.github.modelDesign</groupId>
        <artifactId>server</artifactId>
        <version>0.0.1-SNAPSHOT</version>
    </parent>

    <artifactId>mod-asset</artifactId>
    <packaging>pom</packaging>

    <modules>
        <module>mod-asset-api</module>
        <module>mod-asset-biz</module>
    </modules>
</project>
```

```xml
<!-- modelDesign/mod-asset/mod-asset-biz/pom.xml -->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>io.github.modelDesign</groupId>
        <artifactId>mod-asset</artifactId>
        <version>0.0.1-SNAPSHOT</version>
    </parent>

    <artifactId>mod-asset-biz</artifactId>

    <dependencies>
        <dependency>
            <groupId>io.github.modelDesign</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>io.github.modelDesign</groupId>
            <artifactId>mod-auth-api</artifactId>
        </dependency>
        <dependency>
            <groupId>io.github.modelDesign</groupId>
            <artifactId>mod-asset-api</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 3: 把模块接入根工程与 boot，并创建首个表迁移**

```xml
<!-- modelDesign/pom.xml -->
<modules>
    <module>boot</module>
    <module>common</module>
    <module>mod-ai</module>
    <module>mod-asset</module>
    <module>mod-auth</module>
    <module>mod-project</module>
    <module>mod-system</module>
    <module>mod-third-party</module>
    <module>mod-dependencies</module>
</modules>
```

```xml
<!-- modelDesign/boot/pom.xml -->
<dependency>
    <groupId>io.github.modelDesign</groupId>
    <artifactId>mod-asset-biz</artifactId>
</dependency>
```

```sql
/* modelDesign/boot/src/main/resources/db/migration/V1.20260424101000__create_asset_tables.sql */
CREATE TABLE IF NOT EXISTS public."assetDevice" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "deviceName" varchar(100) NOT NULL,
    "categoryId" bigint NOT NULL,
    "assetCode" varchar(64) NOT NULL,
    "serialNumber" varchar(128),
    status integer NOT NULL,
    "locationId" bigint,
    "currentUserId" bigint,
    "purchaseDate" date,
    remark varchar(500) DEFAULT '',
    "lastOperatedAt" timestamp,
    deleted integer DEFAULT 0 NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."assetDevice"
    ADD CONSTRAINT "uk_assetDevice_tenant_assetCode"
    UNIQUE ("tenantId", "assetCode");

CREATE TABLE IF NOT EXISTS public."assetCategory" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    name varchar(100) NOT NULL,
    sort integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    remark varchar(500) DEFAULT '',
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."assetLocation" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    name varchar(100) NOT NULL,
    code varchar(64) NOT NULL,
    "parentId" bigint DEFAULT 0 NOT NULL,
    "managerUserId" bigint,
    sort integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    remark varchar(500) DEFAULT '',
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."assetTransaction" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "deviceId" bigint NOT NULL,
    "transactionType" integer NOT NULL,
    "beforeStatus" integer,
    "afterStatus" integer,
    "beforeLocationId" bigint,
    "afterLocationId" bigint,
    "beforeUserId" bigint,
    "afterUserId" bigint,
    "operatorUserId" bigint NOT NULL,
    "occurredAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remark varchar(500) DEFAULT '',
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."assetStocktakeTask" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    name varchar(120) NOT NULL,
    "scopeType" integer NOT NULL,
    "scopeLocationId" bigint,
    status integer NOT NULL,
    "startedAt" timestamp,
    "finishedAt" timestamp,
    remark varchar(500) DEFAULT '',
    "createdUserId" bigint NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public."assetStocktakeItem" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "taskId" bigint NOT NULL,
    "deviceId" bigint NOT NULL,
    "resultStatus" integer,
    "actualLocationId" bigint,
    "actualUserId" bigint,
    "checkedUserId" bigint,
    "checkedAt" timestamp,
    remark varchar(500) DEFAULT '',
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

- [ ] **Step 4: 运行后端编译验证，确认模块和迁移脚本已接通**

```bash
./mvnw -pl boot -am -DskipTests compile
```

Expected:

```text
[INFO] Reactor Summary:
[INFO] mod-asset-api ........................ SUCCESS
[INFO] mod-asset-biz ........................ SUCCESS
[INFO] boot ................................. SUCCESS
```

- [ ] **Step 5: 提交基础骨架**

```bash
git add \
  modelDesign/pom.xml \
  modelDesign/boot/pom.xml \
  modelDesign/mod-asset/pom.xml \
  modelDesign/mod-asset/mod-asset-api/pom.xml \
  modelDesign/mod-asset/mod-asset-biz/pom.xml \
  modelDesign/boot/src/main/resources/db/migration/V1.20260424101000__create_asset_tables.sql
git commit -m "feat: 新增资产模块基础骨架"
```

### Task 2: 设备台账领域模型、查询与入库登记

**Files:**
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetDevice.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetCategory.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetLocation.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetDeviceStatusEnum.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetDeviceMapper.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceListRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceCreateRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetDeviceVo.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetDeviceService.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetDeviceController.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetDeviceServiceTest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/controller/AssetDeviceControllerTest.java`

- [ ] **Step 1: 先写失败测试，锁定入库后默认状态与租户隔离**

```java
@Test
void createShouldPersistDeviceWithInStockStatus() {
    AuthCurrentUserApi authCurrentUserApi = mock(AuthCurrentUserApi.class);
    AssetDeviceMapper assetDeviceMapper = mock(AssetDeviceMapper.class);
    AssetCategoryMapper assetCategoryMapper = mock(AssetCategoryMapper.class);
    AssetLocationMapper assetLocationMapper = mock(AssetLocationMapper.class);
    AssetTransactionWriteService transactionWriteService = mock(AssetTransactionWriteService.class);
    AssetDeviceService service = new AssetDeviceService(
            authCurrentUserApi,
            assetDeviceMapper,
            assetCategoryMapper,
            assetLocationMapper,
            transactionWriteService
    );

    when(authCurrentUserApi.getCurrentUser())
            .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());
    when(assetCategoryMapper.selectCount(any())).thenReturn(1L);
    when(assetLocationMapper.selectCount(any())).thenReturn(1L);
    doAnswer(invocation -> {
        AssetDevice entity = invocation.getArgument(0);
        entity.setId(11L);
        return 1;
    }).when(assetDeviceMapper).insert(any(AssetDevice.class));

    AssetDeviceCreateRequest request = new AssetDeviceCreateRequest();
    request.setDeviceName("ThinkPad X1");
    request.setCategoryId(2L);
    request.setAssetCode("NB-1001");
    request.setSerialNumber("SN-1001");
    request.setLocationId(5L);

    AssetDeviceVo result = service.create(request);

    assertEquals(11L, result.getId());
    assertEquals(1001L, result.getTenantId());
    assertEquals(AssetDeviceStatusEnum.IN_STOCK.getValue(), result.getStatus());
}
```

- [ ] **Step 2: 运行测试，确认当前类和接口尚不存在**

```bash
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol: class AssetDeviceService
cannot find symbol: class AssetDeviceCreateRequest
```

- [ ] **Step 3: 写最小可用台账实现和列表/创建接口**

```java
/**
 * 设备台账实体。
 */
@Data
@TableName("assetDevice")
public class AssetDevice {
    private Long id;
    private Long tenantId;
    private String deviceName;
    private Long categoryId;
    private String assetCode;
    private String serialNumber;
    private Integer status;
    private Long locationId;
    private Long currentUserId;
    private LocalDate purchaseDate;
    private String remark;
    private LocalDateTime lastOperatedAt;
    private Integer deleted;
}
```

```java
/**
 * 设备台账服务。
 */
@Service
@RequiredArgsConstructor
public class AssetDeviceService {
    private final AuthCurrentUserApi authCurrentUserApi;
    private final AssetDeviceMapper assetDeviceMapper;
    private final AssetCategoryMapper assetCategoryMapper;
    private final AssetLocationMapper assetLocationMapper;
    private final AssetTransactionWriteService assetTransactionWriteService;

    public Page<AssetDeviceVo> getList(AssetDeviceListRequest request) {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        LambdaQueryWrapper<AssetDevice> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(AssetDevice::getTenantId, currentUser.getTenantId());
        wrapper.eq(AssetDevice::getDeleted, 0);
        wrapper.orderByDesc(AssetDevice::getUpdateTime);
        Page<AssetDevice> page = assetDeviceMapper.selectPage(
                new Page<>(request.getCurrent(), request.getPageSize()),
                wrapper
        );
        return page.convert(this::toDeviceVo);
    }

    @Transactional(rollbackFor = Exception.class)
    public AssetDeviceVo create(AssetDeviceCreateRequest request) {
        AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
        validateCategory(request.getCategoryId(), currentUser.getTenantId());
        validateLocation(request.getLocationId(), currentUser.getTenantId());
        validateAssetCode(request.getAssetCode(), currentUser.getTenantId(), null);

        AssetDevice entity = new AssetDevice();
        entity.setTenantId(currentUser.getTenantId());
        entity.setDeviceName(request.getDeviceName().trim());
        entity.setCategoryId(request.getCategoryId());
        entity.setAssetCode(request.getAssetCode().trim());
        entity.setSerialNumber(normalizeText(request.getSerialNumber()));
        entity.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
        entity.setLocationId(request.getLocationId());
        entity.setPurchaseDate(request.getPurchaseDate());
        entity.setRemark(defaultString(request.getRemark()));
        entity.setDeleted(0);
        entity.setLastOperatedAt(LocalDateTime.now());
        assetDeviceMapper.insert(entity);

        assetTransactionWriteService.writeInbound(entity, currentUser.getUserId(), "入库登记");
        return toDeviceVo(entity);
    }
}
```

```java
@Tag(name = "设备台账")
@RestController
@RequestMapping("/asset/device")
@RequiredArgsConstructor
@Validated
public class AssetDeviceController {
    private final AssetDeviceService assetDeviceService;

    @Operation(summary = "分页查询设备台账")
    @GetMapping("/list")
    public Page<AssetDeviceVo> list(@Valid AssetDeviceListRequest request) {
        return assetDeviceService.getList(request);
    }

    @Operation(summary = "入库登记")
    @PostMapping("/create")
    public AssetDeviceVo create(@Valid @RequestBody AssetDeviceCreateRequest request) {
        return assetDeviceService.create(request);
    }
}
```

- [ ] **Step 4: 运行精准测试，确认入库和控制器委托通过**

```bash
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest,AssetDeviceControllerTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
BUILD SUCCESS
Tests run: 2, Failures: 0, Errors: 0
```

- [ ] **Step 5: 提交设备台账基础能力**

```bash
git add \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetDevice.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetCategory.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetLocation.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetDeviceStatusEnum.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/mapper/AssetDeviceMapper.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceListRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceCreateRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetDeviceVo.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetDeviceService.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetDeviceController.java \
  modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetDeviceServiceTest.java \
  modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/controller/AssetDeviceControllerTest.java
git commit -m "feat: 新增设备台账查询与入库登记"
```

### Task 3: 领用、归还、调拨、报废状态机与流水

**Files:**
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetTransaction.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetTransactionTypeEnum.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceEditRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceReceiveRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceReturnRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceTransferRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceScrapRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetTransactionWriteService.java`
- Modify: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetDeviceService.java`
- Modify: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetDeviceController.java`
- Modify: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetDeviceServiceTest.java`

- [ ] **Step 1: 先写失败测试，锁定状态流转边界**

```java
@Test
void receiveShouldMoveInStockDeviceToInUse() {
    AssetDevice existed = buildDevice(11L, 1001L, AssetDeviceStatusEnum.IN_STOCK.getValue());
    existed.setLocationId(3L);
    when(assetDeviceMapper.selectById(11L)).thenReturn(existed);
    when(authCurrentUserApi.getCurrentUser())
            .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());

    AssetDeviceReceiveRequest request = new AssetDeviceReceiveRequest();
    request.setId(11L);
    request.setCurrentUserId(66L);
    request.setRemark("研发领用");

    AssetDeviceVo result = service.receive(request);

    assertEquals(AssetDeviceStatusEnum.IN_USE.getValue(), result.getStatus());
    assertEquals(66L, result.getCurrentUserId());
}

@Test
void scrapShouldRejectInUseDevice() {
    AssetDevice existed = buildDevice(11L, 1001L, AssetDeviceStatusEnum.IN_USE.getValue());
    when(assetDeviceMapper.selectById(11L)).thenReturn(existed);
    when(authCurrentUserApi.getCurrentUser())
            .thenReturn(AuthCurrentUserDto.builder().userId(7L).tenantId(1001L).build());

    AssetDeviceScrapRequest request = new AssetDeviceScrapRequest();
    request.setId(11L);

    BusinessException exception = assertThrows(BusinessException.class, () -> service.scrap(request));
    assertEquals("领用中的设备请先归还后再报废", exception.getMessage());
}
```

- [ ] **Step 2: 运行测试，确认动作方法与流水写入尚未实现**

```bash
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol: method receive(...)
cannot find symbol: method scrap(...)
```

- [ ] **Step 3: 实现动作接口、状态校验与流水记录**

```java
@Transactional(rollbackFor = Exception.class)
public AssetDeviceVo receive(AssetDeviceReceiveRequest request) {
    AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
    AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
    requireStatus(entity, AssetDeviceStatusEnum.IN_STOCK, "仅在库设备允许领用");
    entity.setStatus(AssetDeviceStatusEnum.IN_USE.getValue());
    entity.setCurrentUserId(request.getCurrentUserId());
    entity.setLastOperatedAt(LocalDateTime.now());
    assetDeviceMapper.updateById(entity);
    assetTransactionWriteService.writeReceive(entity, currentUser.getUserId(), request.getRemark());
    return toDeviceVo(entity);
}

@Transactional(rollbackFor = Exception.class)
public AssetDeviceVo returned(AssetDeviceReturnRequest request) {
    AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
    AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
    requireStatus(entity, AssetDeviceStatusEnum.IN_USE, "仅领用中的设备允许归还");
    entity.setStatus(AssetDeviceStatusEnum.IN_STOCK.getValue());
    entity.setCurrentUserId(null);
    entity.setLocationId(request.getLocationId());
    entity.setLastOperatedAt(LocalDateTime.now());
    assetDeviceMapper.updateById(entity);
    assetTransactionWriteService.writeReturn(entity, currentUser.getUserId(), request.getRemark());
    return toDeviceVo(entity);
}

@Transactional(rollbackFor = Exception.class)
public AssetDeviceVo scrap(AssetDeviceScrapRequest request) {
    AuthCurrentUserDto currentUser = authCurrentUserApi.getCurrentUser();
    AssetDevice entity = requireDevice(request.getId(), currentUser.getTenantId());
    if (Objects.equals(entity.getStatus(), AssetDeviceStatusEnum.IN_USE.getValue())) {
        throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "领用中的设备请先归还后再报废");
    }
    entity.setStatus(AssetDeviceStatusEnum.SCRAPPED.getValue());
    entity.setLastOperatedAt(LocalDateTime.now());
    assetDeviceMapper.updateById(entity);
    assetTransactionWriteService.writeScrap(entity, currentUser.getUserId(), request.getRemark());
    return toDeviceVo(entity);
}
```

```java
@Operation(summary = "领用设备")
@PostMapping("/receive")
public AssetDeviceVo receive(@Valid @RequestBody AssetDeviceReceiveRequest request) {
    return assetDeviceService.receive(request);
}

@Operation(summary = "归还设备")
@PostMapping("/return")
public AssetDeviceVo returned(@Valid @RequestBody AssetDeviceReturnRequest request) {
    return assetDeviceService.returned(request);
}

@Operation(summary = "调拨设备")
@PostMapping("/transfer")
public AssetDeviceVo transfer(@Valid @RequestBody AssetDeviceTransferRequest request) {
    return assetDeviceService.transfer(request);
}

@Operation(summary = "报废设备")
@PostMapping("/scrap")
public AssetDeviceVo scrap(@Valid @RequestBody AssetDeviceScrapRequest request) {
    return assetDeviceService.scrap(request);
}
```

- [ ] **Step 4: 运行状态机测试，确认主路径与失败路径通过**

```bash
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
BUILD SUCCESS
Tests run: 4, Failures: 0, Errors: 0
```

- [ ] **Step 5: 提交生命周期动作实现**

```bash
git add \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/domain/AssetTransaction.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/enums/AssetTransactionTypeEnum.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceEditRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceReceiveRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceReturnRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceTransferRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetDeviceScrapRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetTransactionWriteService.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetDeviceService.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetDeviceController.java \
  modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetDeviceServiceTest.java
git commit -m "feat: 新增设备生命周期动作与流水"
```

### Task 4: 位置管理、下拉接口与盘点任务

**Files:**
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetLocationCreateRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetLocationEditRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetStocktakeCreateRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetStocktakeCheckRequest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetLocationVo.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetStocktakeTaskVo.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetStocktakeDetailVo.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetOptionVo.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetLocationService.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetStocktakeService.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetOptionService.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetLocationController.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetStocktakeController.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetOptionController.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetLocationServiceTest.java`
- Create: `modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetStocktakeServiceTest.java`

- [ ] **Step 1: 先写失败测试，锁定位置树和盘点完成态**

```java
@Test
void createLocationShouldPersistCurrentTenantNode() {
    when(authCurrentUserApi.getCurrentUser())
            .thenReturn(AuthCurrentUserDto.builder().tenantId(1001L).build());
    when(assetLocationMapper.selectCount(any())).thenReturn(0L);

    AssetLocationCreateRequest request = new AssetLocationCreateRequest();
    request.setName("A栋-3楼-机房");
    request.setCode("A3F");
    request.setParentId(0L);

    AssetLocationVo result = service.create(request);

    assertEquals("A栋-3楼-机房", result.getName());
    assertEquals(1001L, result.getTenantId());
}

@Test
void completeShouldRejectFurtherCheckWhenTaskFinished() {
    AssetStocktakeTask task = new AssetStocktakeTask();
    task.setId(3L);
    task.setTenantId(1001L);
    task.setStatus(AssetStocktakeStatusEnum.FINISHED.getValue());
    when(assetStocktakeTaskMapper.selectById(3L)).thenReturn(task);

    AssetStocktakeCheckRequest request = new AssetStocktakeCheckRequest();
    request.setTaskId(3L);
    request.setDeviceId(11L);

    BusinessException exception = assertThrows(BusinessException.class, () -> stocktakeService.check(request));
    assertEquals("盘点任务已完成，不能继续提交", exception.getMessage());
}
```

- [ ] **Step 2: 运行测试，确认位置服务和盘点服务尚未建立**

```bash
./mvnw -pl boot -am -Dtest=AssetLocationServiceTest,AssetStocktakeServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
COMPILATION ERROR
cannot find symbol: class AssetLocationService
cannot find symbol: class AssetStocktakeService
```

- [ ] **Step 3: 实现位置 CRUD、盘点任务与下拉聚合接口**

```java
@Tag(name = "设备位置")
@RestController
@RequestMapping("/asset/location")
@RequiredArgsConstructor
public class AssetLocationController {
    private final AssetLocationService assetLocationService;

    @Operation(summary = "获取位置列表")
    @GetMapping("/list")
    public List<AssetLocationVo> list() {
        return assetLocationService.getList();
    }

    @Operation(summary = "新建位置")
    @PostMapping("/create")
    public AssetLocationVo create(@Valid @RequestBody AssetLocationCreateRequest request) {
        return assetLocationService.create(request);
    }
}
```

```java
@Tag(name = "盘点任务")
@RestController
@RequestMapping("/asset/stocktake")
@RequiredArgsConstructor
public class AssetStocktakeController {
    private final AssetStocktakeService assetStocktakeService;

    @Operation(summary = "创建盘点任务")
    @PostMapping("/create")
    public AssetStocktakeTaskVo create(@Valid @RequestBody AssetStocktakeCreateRequest request) {
        return assetStocktakeService.create(request);
    }

    @Operation(summary = "提交盘点结果")
    @PostMapping("/check")
    public AssetStocktakeDetailVo check(@Valid @RequestBody AssetStocktakeCheckRequest request) {
        return assetStocktakeService.check(request);
    }

    @Operation(summary = "完成盘点任务")
    @PostMapping("/complete")
    public AssetStocktakeTaskVo complete(@RequestParam Long id) {
        return assetStocktakeService.complete(id);
    }
}
```

```java
@Tag(name = "资产下拉选项")
@RestController
@RequestMapping("/asset/options")
@RequiredArgsConstructor
public class AssetOptionController {
    private final AssetOptionService assetOptionService;

    @GetMapping("/users")
    public List<AssetOptionVo> users() {
        return assetOptionService.getUserOptions();
    }

    @GetMapping("/locations")
    public List<AssetOptionVo> locations() {
        return assetOptionService.getLocationOptions();
    }

    @GetMapping("/categories")
    public List<AssetOptionVo> categories() {
        return assetOptionService.getCategoryOptions();
    }
}
```

- [ ] **Step 4: 运行位置与盘点测试**

```bash
./mvnw -pl boot -am -Dtest=AssetLocationServiceTest,AssetStocktakeServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
BUILD SUCCESS
Tests run: 4, Failures: 0, Errors: 0
```

- [ ] **Step 5: 提交位置、盘点与下拉接口**

```bash
git add \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetLocationCreateRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetLocationEditRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetStocktakeCreateRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/request/AssetStocktakeCheckRequest.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetLocationVo.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetStocktakeTaskVo.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetStocktakeDetailVo.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/response/AssetOptionVo.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetLocationService.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetStocktakeService.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/service/AssetOptionService.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetLocationController.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetStocktakeController.java \
  modelDesign/mod-asset/mod-asset-biz/src/main/java/io/github/modelDesign/asset/controller/AssetOptionController.java \
  modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetLocationServiceTest.java \
  modelDesign/mod-asset/mod-asset-biz/src/test/java/io/github/modelDesign/asset/service/AssetStocktakeServiceTest.java
git commit -m "feat: 新增设备位置与盘点任务能力"
```

### Task 5: 菜单、权限资源与前端 API 层

**Files:**
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260424101100__seed_asset_menu.sql`
- Create: `modelDesign/boot/src/main/resources/db/migration/V1.20260424101200__seed_asset_permission_resources.sql`
- Create: `admin-rsbuild/src/api/modules/asset-device.ts`
- Create: `admin-rsbuild/src/api/modules/asset-location.ts`
- Create: `admin-rsbuild/src/api/modules/asset-stocktake.ts`
- Create: `admin-rsbuild/src/constants/queryKey/asset.ts`
- Modify: `admin-rsbuild/src/api/index.ts`
- Modify: `admin-rsbuild/src/constants/queryKey/index.ts`
- Modify: `admin-rsbuild/src/constants/permission.ts`
- Modify: `admin-rsbuild/src/constants/permissionGroupShortcut.ts`
- Modify: `admin-rsbuild/src/constants/resourceApiProfile.generated.ts`
- Create: `admin-rsbuild/src/api/modules/__tests__/asset-device.test.ts`

- [ ] **Step 1: 先写失败测试，锁定前端 API 路径和查询键**

```ts
import { describe, expect, it } from 'vitest';

import queryKey from '@/constants/queryKey';
import { PERMISSION_RESOURCE } from '@/constants/permission';

describe('asset constants', () => {
  it('should expose asset query keys and permissions', () => {
    expect(queryKey.asset.deviceList()).toEqual(['assetDeviceList']);
    expect(PERMISSION_RESOURCE.assetDevice).toBe('/asset/device');
    expect(PERMISSION_RESOURCE.assetStocktakeManage).toBe('/asset/stocktake/manage');
  });
});
```

- [ ] **Step 2: 运行前端测试，确认当前常量和 API 尚未接入**

```bash
npm run test:run -- src/api/modules/__tests__/asset-device.test.ts
```

Expected:

```text
Failed to resolve import "@/constants/queryKey/asset"
```

- [ ] **Step 3: 添加菜单 SQL、权限资源与前端 API 封装**

```sql
/* V1.20260424101100__seed_asset_menu.sql */
INSERT INTO public.menu ("parentId", name, title, "iconType", "iconValue", path, sort, status, "nodeType")
VALUES
  (0, '/asset', '库存管理', 'mdi', 'mdi:package-variant-closed', '/asset/device', 60, 1, 0),
  ((SELECT id FROM public.menu WHERE name = '/asset'), '/asset/device', '设备台账', 'none', '', '/asset/device', 10, 1, 0),
  ((SELECT id FROM public.menu WHERE name = '/asset'), '/asset/location', '位置管理', 'none', '', '/asset/location', 20, 1, 0),
  ((SELECT id FROM public.menu WHERE name = '/asset'), '/asset/stocktake', '盘点任务', 'none', '', '/asset/stocktake', 30, 1, 0)
ON CONFLICT DO NOTHING;
```

```ts
/** admin-rsbuild/src/api/modules/asset-device.ts */
import request from '@/utils/request';

export interface AssetDeviceItem {
  id: number;
  tenantId: number;
  deviceName: string;
  categoryId: number;
  assetCode: string;
  serialNumber?: string;
  status: number;
  locationId?: number;
  currentUserId?: number;
  purchaseDate?: string;
  remark: string;
}

export interface AssetDeviceListParams {
  deviceName?: string;
  categoryId?: number;
  assetCode?: string;
  serialNumber?: string;
  status?: number;
  locationId?: number;
  currentUserId?: number;
  current?: number;
  pageSize?: number;
}

export const getList = (params?: AssetDeviceListParams) => {
  return request<{ items: AssetDeviceItem[]; total: number }>('/asset/device/list', {
    method: 'get',
    params,
  });
};

export const create = (data: Record<string, unknown>) => {
  return request<AssetDeviceItem>('/asset/device/create', {
    method: 'post',
    data,
  });
};
```

```ts
/** admin-rsbuild/src/constants/queryKey/asset.ts */
export const deviceList = () => ['assetDeviceList'];
export const locationList = () => ['assetLocationList'];
export const stocktakeList = () => ['assetStocktakeList'];
export const stocktakeDetail = (id: number) => ['assetStocktakeDetail', id];
export const userOptions = () => ['assetUserOptions'];
export const locationOptions = () => ['assetLocationOptions'];
export const categoryOptions = () => ['assetCategoryOptions'];
```

- [ ] **Step 4: 运行前端 API 测试**

```bash
npm run test:run -- src/api/modules/__tests__/asset-device.test.ts
```

Expected:

```text
✓ should expose asset query keys and permissions
```

- [ ] **Step 5: 提交菜单、权限与 API 层**

```bash
git add \
  modelDesign/boot/src/main/resources/db/migration/V1.20260424101100__seed_asset_menu.sql \
  modelDesign/boot/src/main/resources/db/migration/V1.20260424101200__seed_asset_permission_resources.sql \
  admin-rsbuild/src/api/modules/asset-device.ts \
  admin-rsbuild/src/api/modules/asset-location.ts \
  admin-rsbuild/src/api/modules/asset-stocktake.ts \
  admin-rsbuild/src/api/index.ts \
  admin-rsbuild/src/constants/queryKey/asset.ts \
  admin-rsbuild/src/constants/queryKey/index.ts \
  admin-rsbuild/src/constants/permission.ts \
  admin-rsbuild/src/constants/permissionGroupShortcut.ts \
  admin-rsbuild/src/constants/resourceApiProfile.generated.ts \
  admin-rsbuild/src/api/modules/__tests__/asset-device.test.ts
git commit -m "feat: 接入资产菜单权限与前端API"
```

### Task 6: 设备台账页面与动作弹窗

**Files:**
- Create: `admin-rsbuild/src/routes/asset/device/index.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/#DeviceTable.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/#DeviceFormModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/#ReceiveModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/#ReturnModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/#TransferModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/#ScrapModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/device/__tests__/DeviceTable.test.tsx`

- [ ] **Step 1: 先写失败测试，锁定状态按钮显隐和查询参数组装**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DeviceTable from '../#DeviceTable';

describe('DeviceTable', () => {
  it('should show receive action for in-stock device', async () => {
    render(<DeviceTable />);
    expect(await screen.findByText('领用')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行页面测试，确认路由和页面组件不存在**

```bash
npm run test:run -- src/routes/asset/device/__tests__/DeviceTable.test.tsx
```

Expected:

```text
Failed to resolve import "../#DeviceTable"
```

- [ ] **Step 3: 实现设备台账页、筛选表单和动作弹窗**

```tsx
/** admin-rsbuild/src/routes/asset/device/index.tsx */
import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import DeviceTable from './#DeviceTable';

/**
 * 设备台账路由页。
 */
export const Route = createFileRoute('/asset/device/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <DeviceTable />
    </Card>
  );
}
```

```tsx
/** admin-rsbuild/src/routes/asset/device/#DeviceTable.tsx */
const DeviceTable = () => {
  const modal = useKModal();
  const [keyword, setKeyword] = useState('');
  const params = useMemo(() => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return {};
    }

    return {
      deviceName: trimmedKeyword,
    };
  }, [keyword]);

  const columns: TableColumnsType<AssetDeviceItem> = [
    { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName' },
    { title: '资产编号', dataIndex: 'assetCode', key: 'assetCode' },
    { title: 'SN', dataIndex: 'serialNumber', key: 'serialNumber' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        return (
          <Space>
            {record.status === 1 ? (
              <KTable.Button onClick={async () => modal.open({ title: '领用设备', children: <ReceiveModal record={record} /> })}>
                领用
              </KTable.Button>
            ) : null}
            {record.status === 2 ? (
              <KTable.Button onClick={async () => modal.open({ title: '归还设备', children: <ReturnModal record={record} /> })}>
                归还
              </KTable.Button>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<AssetDeviceItem>
      queryKey={[...queryKey.asset.deviceList(), params]}
      request={ApiAssetDevice.getList}
      params={params}
      rowKey={'id'}
      columns={columns}
      toolbar={
        <Input.Search
          allowClear
          placeholder={'请输入设备名称搜索'}
          onSearch={(value) => {
            setKeyword(value);
          }}
        />
      }
    />
  );
};
```

- [ ] **Step 4: 运行设备台账页面测试**

```bash
npm run test:run -- src/routes/asset/device/__tests__/DeviceTable.test.tsx
```

Expected:

```text
✓ should show receive action for in-stock device
```

- [ ] **Step 5: 提交设备台账页面**

```bash
git add \
  admin-rsbuild/src/routes/asset/device/index.tsx \
  admin-rsbuild/src/routes/asset/device/#DeviceTable.tsx \
  admin-rsbuild/src/routes/asset/device/#DeviceFormModal.tsx \
  admin-rsbuild/src/routes/asset/device/#ReceiveModal.tsx \
  admin-rsbuild/src/routes/asset/device/#ReturnModal.tsx \
  admin-rsbuild/src/routes/asset/device/#TransferModal.tsx \
  admin-rsbuild/src/routes/asset/device/#ScrapModal.tsx \
  admin-rsbuild/src/routes/asset/device/__tests__/DeviceTable.test.tsx
git commit -m "feat: 新增设备台账页面与动作弹窗"
```

### Task 7: 位置管理页、盘点任务页与整体回归

**Files:**
- Create: `admin-rsbuild/src/routes/asset/location/index.tsx`
- Create: `admin-rsbuild/src/routes/asset/location/#LocationTable.tsx`
- Create: `admin-rsbuild/src/routes/asset/location/#LocationFormModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/location/__tests__/LocationTable.test.tsx`
- Create: `admin-rsbuild/src/routes/asset/stocktake/index.tsx`
- Create: `admin-rsbuild/src/routes/asset/stocktake/#StocktakeTaskTable.tsx`
- Create: `admin-rsbuild/src/routes/asset/stocktake/#StocktakeCreateModal.tsx`
- Create: `admin-rsbuild/src/routes/asset/stocktake/#StocktakeDetailDrawer.tsx`
- Create: `admin-rsbuild/src/routes/asset/stocktake/__tests__/StocktakeTaskTable.test.tsx`

- [ ] **Step 1: 先写失败测试，锁定位置表格和盘点任务入口**

```tsx
describe('LocationTable', () => {
  it('should render create button', async () => {
    render(<LocationTable />);
    expect(await screen.findByText('新建位置')).toBeInTheDocument();
  });
});

describe('StocktakeTaskTable', () => {
  it('should render create stocktake task button', async () => {
    render(<StocktakeTaskTable />);
    expect(await screen.findByText('发起盘点')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行页面测试，确认位置页和盘点页尚未存在**

```bash
npm run test:run -- src/routes/asset/location/__tests__/LocationTable.test.tsx
npm run test:run -- src/routes/asset/stocktake/__tests__/StocktakeTaskTable.test.tsx
```

Expected:

```text
Failed to resolve import "../#LocationTable"
Failed to resolve import "../#StocktakeTaskTable"
```

- [ ] **Step 3: 实现位置管理页和盘点任务页**

```tsx
/** admin-rsbuild/src/routes/asset/location/index.tsx */
export const Route = createFileRoute('/asset/location/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <LocationTable />
    </Card>
  );
}
```

```tsx
/** admin-rsbuild/src/routes/asset/stocktake/index.tsx */
export const Route = createFileRoute('/asset/stocktake/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <StocktakeTaskTable />
    </Card>
  );
}
```

```tsx
/** admin-rsbuild/src/routes/asset/stocktake/#StocktakeTaskTable.tsx */
const StocktakeTaskTable = () => {
  const modal = useKModal();

  return (
    <KTable
      queryKey={queryKey.asset.stocktakeList()}
      request={ApiAssetStocktake.getList}
      rowKey={'id'}
      columns={[
        { title: '任务名称', dataIndex: 'name', key: 'name' },
        { title: '状态', dataIndex: 'statusText', key: 'statusText' },
      ]}
      toolbar={
        <KTable.Button
          type={'primary'}
          permissionCode={PERMISSION_RESOURCE.assetStocktakeManage}
          onClick={async () => {
            await modal.open({
              title: '发起盘点',
              width: 640,
              children: <StocktakeCreateModal />,
            });
          }}
        >
          发起盘点
        </KTable.Button>
      }
    />
  );
};
```

- [ ] **Step 4: 运行前端页测试和最小后端回归**

```bash
npm run test:run -- src/routes/asset/location/__tests__/LocationTable.test.tsx
npm run test:run -- src/routes/asset/stocktake/__tests__/StocktakeTaskTable.test.tsx
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest,AssetLocationServiceTest,AssetStocktakeServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
✓ should render create button
✓ should render create stocktake task button
BUILD SUCCESS
```

- [ ] **Step 5: 运行仓库级最终验证并提交**

```bash
npm run test:run -- src/api/modules/__tests__/asset-device.test.ts
npm run test:run -- src/routes/asset/device/__tests__/DeviceTable.test.tsx
npm run test:run -- src/routes/asset/location/__tests__/LocationTable.test.tsx
npm run test:run -- src/routes/asset/stocktake/__tests__/StocktakeTaskTable.test.tsx
./mvnw -pl boot -am -Dtest=AssetDeviceServiceTest,AssetLocationServiceTest,AssetStocktakeServiceTest,AssetDeviceControllerTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected:

```text
All specified front-end tests passed
BUILD SUCCESS
```

```bash
git add \
  admin-rsbuild/src/routes/asset/location/index.tsx \
  admin-rsbuild/src/routes/asset/location/#LocationTable.tsx \
  admin-rsbuild/src/routes/asset/location/#LocationFormModal.tsx \
  admin-rsbuild/src/routes/asset/location/__tests__/LocationTable.test.tsx \
  admin-rsbuild/src/routes/asset/stocktake/index.tsx \
  admin-rsbuild/src/routes/asset/stocktake/#StocktakeTaskTable.tsx \
  admin-rsbuild/src/routes/asset/stocktake/#StocktakeCreateModal.tsx \
  admin-rsbuild/src/routes/asset/stocktake/#StocktakeDetailDrawer.tsx \
  admin-rsbuild/src/routes/asset/stocktake/__tests__/StocktakeTaskTable.test.tsx
git commit -m "feat: 新增设备位置与盘点页面"
```

## 自检

- Spec coverage:
  - 独立模块：Task 1
  - 台账与入库：Task 2
  - 领用/归还/调拨/报废：Task 3
  - 位置/盘点/下拉：Task 4
  - 菜单/权限/API：Task 5
  - 设备台账页：Task 6
  - 位置与盘点页：Task 7
- Placeholder scan:
  - 已检查，无 `TODO`、`TBD`、`implement later` 等占位项
- Type consistency:
  - 统一使用 `AssetDeviceService`、`AssetLocationService`、`AssetStocktakeService`
  - 前端统一使用 `queryKey.asset.*` 和 `PERMISSION_RESOURCE.asset*`
