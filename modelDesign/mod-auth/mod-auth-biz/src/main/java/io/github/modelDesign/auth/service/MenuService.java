package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.Menu;
import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import io.github.modelDesign.auth.enums.MenuStatusEnum;
import io.github.modelDesign.auth.mapper.MenuMapper;
import io.github.modelDesign.auth.request.MenuCreateRequest;
import io.github.modelDesign.auth.request.MenuEditRequest;
import io.github.modelDesign.auth.response.MenuVo;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Collection;
import java.util.Set;

/**
 * 菜单服务。
 */
@Service
@RequiredArgsConstructor
public class MenuService extends ServiceImpl<MenuMapper, Menu> implements IService<Menu> {
    /**
     * 时间格式化器。
     */
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 查询全部菜单。
     *
     * @return 菜单列表
     */
    public List<Menu> listAllMenus() {
        return lambdaQuery()
                .orderByAsc(Menu::getSort)
                .orderByAsc(Menu::getId)
                .list();
    }

    /**
     * 查询可用于导航的菜单。
     *
     * @return 菜单列表
     */
    public List<Menu> listEnabledMenuNodes() {
        return lambdaQuery()
                .eq(Menu::getStatus, MenuStatusEnum.ENABLED)
                .eq(Menu::getNodeType, MenuNodeTypeEnum.MENU)
                .orderByAsc(Menu::getSort)
                .orderByAsc(Menu::getId)
                .list();
    }

    /**
     * 查询全部已启用节点。
     *
     * 该方法同时返回菜单与按钮节点，
     * 用于支持通配符权限回显时的全量匹配。
     *
     * @return 已启用节点列表
     */
    public List<Menu> listEnabledNodes() {
        return lambdaQuery()
                .eq(Menu::getStatus, MenuStatusEnum.ENABLED)
                .orderByAsc(Menu::getSort)
                .orderByAsc(Menu::getId)
                .list();
    }

    /**
     * 按资源标识批量查询已启用节点。
     *
     * 该方法同时服务于“当前用户权限回显”和“按钮权限判定”场景，
     * 因此不会限制节点类型，由调用方自行区分菜单或按钮。
     *
     * @param names 资源标识集合
     * @return 已启用节点列表
     */
    public List<Menu> listEnabledNodesByNames(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return List.of();
        }
        return lambdaQuery()
                .eq(Menu::getStatus, MenuStatusEnum.ENABLED)
                .in(Menu::getName, names)
                .orderByAsc(Menu::getSort)
                .orderByAsc(Menu::getId)
                .list();
    }

    /**
     * 获取资源标识集合中真实存在的标识。
     *
     * @param names 待校验资源标识
     * @return 已存在的资源标识集合
     */
    public Set<String> getExistingNameSet(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return Set.of();
        }
        return lambdaQuery()
                .in(Menu::getName, names)
                .list()
                .stream()
                .map(Menu::getName)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    /**
     * 获取全部资源标识集合。
     *
     * @return 全部资源标识集合
     */
    public Set<String> getAllNameSet() {
        return lambdaQuery()
                .select(Menu::getName)
                .list()
                .stream()
                .map(Menu::getName)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    /**
     * 获取菜单列表。
     *
     * @return 菜单响应列表
     */
    public List<MenuVo> getList() {
        return listAllMenus().stream()
                .map(this::toMenuVo)
                .toList();
    }

    /**
     * 创建菜单。
     *
     * @param request 创建请求
     * @return 菜单响应
     */
    public MenuVo create(MenuCreateRequest request) {
        validateRequest(request.getParentId(), request.getName(), request.getNodeType(), request.getSort(), null);
        Menu menu = new Menu();
        fillMenu(menu, request.getParentId(), request.getName(), request.getTitle(), request.getNodeType(), request.getIconType(), request.getIconValue(), request.getSort());
        menu.setStatus(MenuStatusEnum.ENABLED);
        save(menu);
        return toMenuVo(menu);
    }

    /**
     * 编辑菜单。
     *
     * @param id      菜单 ID
     * @param request 编辑请求
     * @return 菜单响应
     */
    public MenuVo edit(Long id, MenuEditRequest request) {
        Menu menu = requireMenu(id);
        validateRequest(request.getParentId(), request.getName(), request.getNodeType(), request.getSort(), id);
        validateParentRelation(id, request.getParentId());
        fillMenu(menu, request.getParentId(), request.getName(), request.getTitle(), request.getNodeType(), request.getIconType(), request.getIconValue(), request.getSort());
        updateById(menu);
        return toMenuVo(menu);
    }

    /**
     * 级联删除菜单。
     *
     * @param ids 菜单 ID 列表
     * @return 删除数量
     */
    public int delete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        Set<Long> allIds = collectDescendantIds(ids);
        if (allIds.isEmpty()) {
            return 0;
        }
        lambdaUpdate()
                .in(Menu::getId, allIds)
                .remove();
        return allIds.size();
    }

    /**
     * 交换菜单排序。
     *
     * @param sourceId 源菜单 ID
     * @param targetId 目标菜单 ID
     */
    public void swapSort(Long sourceId, Long targetId) {
        Menu source = requireMenu(sourceId);
        Menu target = requireMenu(targetId);
        if (!Objects.equals(source.getParentId(), target.getParentId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "仅支持同级菜单交换排序");
        }
        Integer sourceSort = source.getSort();
        source.setSort(target.getSort());
        target.setSort(sourceSort);
        updateById(source);
        updateById(target);
    }

    /**
     * 校验并获取菜单。
     *
     * @param id 菜单 ID
     * @return 菜单实体
     */
    public Menu requireMenu(Long id) {
        Menu menu = getById(id);
        if (menu == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND.value(), "菜单不存在");
        }
        return menu;
    }

    private void fillMenu(Menu menu, Long parentId, String name, String title, MenuNodeTypeEnum nodeType, String iconType, String iconValue, Integer sort) {
        String normalizedName = normalizeName(name);
        menu.setParentId(parentId);
        menu.setName(normalizedName);
        menu.setPath(normalizedName);
        menu.setTitle(title.trim());
        menu.setNodeType(nodeType);
        menu.setIconType(normalizeIconType(iconType));
        menu.setIconValue(normalizeIconValue(iconValue));
        menu.setSort(sort);
    }

    private void validateRequest(Long parentId, String name, MenuNodeTypeEnum nodeType, Integer sort, Long currentId) {
        validateParent(parentId);
        validateName(name, currentId);
        if (nodeType == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "节点类型不能为空");
        }
        if (sort == null || sort < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "排序不能小于 0");
        }
    }

    private void validateParent(Long parentId) {
        if (parentId == null || parentId < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "父级菜单不合法");
        }
        if (parentId == 0) {
            return;
        }
        if (getById(parentId) == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "父级菜单不存在");
        }
    }

    private void validateName(String name, Long currentId) {
        String normalizedName = normalizeName(name);
        boolean exists = lambdaQuery()
                .eq(Menu::getName, normalizedName)
                .ne(currentId != null, Menu::getId, currentId)
                .count() > 0;
        if (exists) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "菜单标识已存在");
        }
    }

    private void validateParentRelation(Long currentId, Long parentId) {
        if (parentId == null || parentId == 0) {
            return;
        }
        if (Objects.equals(currentId, parentId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "父级菜单不能是自己");
        }
        Set<Long> descendants = collectDescendantIds(List.of(currentId));
        descendants.remove(currentId);
        if (descendants.contains(parentId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "不能将父节点挂到子节点下");
        }
    }

    private Set<Long> collectDescendantIds(List<Long> rootIds) {
        Map<Long, List<Long>> childrenMap = buildChildrenMap();
        Set<Long> result = new HashSet<>();
        ArrayDeque<Long> queue = new ArrayDeque<>(rootIds);
        while (!queue.isEmpty()) {
            Long currentId = queue.poll();
            if (!result.add(currentId)) {
                continue;
            }
            List<Long> children = childrenMap.getOrDefault(currentId, List.of());
            queue.addAll(children);
        }
        return result;
    }

    private Map<Long, List<Long>> buildChildrenMap() {
        Map<Long, List<Long>> childrenMap = new HashMap<>();
        for (Menu item : listAllMenus()) {
            childrenMap.computeIfAbsent(item.getParentId(), key -> new ArrayList<>()).add(item.getId());
        }
        return childrenMap;
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "菜单标识不能为空");
        }
        String normalizedName = name.trim();
        if (!normalizedName.startsWith("/")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "菜单标识必须以 / 开头");
        }
        if (normalizedName.endsWith("/")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "菜单标识不能以 / 结尾");
        }
        return normalizedName;
    }

    private String normalizeIconType(String iconType) {
        return StringUtils.hasText(iconType) ? iconType.trim() : "none";
    }

    private String normalizeIconValue(String iconValue) {
        return StringUtils.hasText(iconValue) ? iconValue.trim() : "";
    }

    private MenuVo toMenuVo(Menu menu) {
        return MenuVo.builder()
                .id(menu.getId())
                .parentId(menu.getParentId())
                .name(menu.getName())
                .title(menu.getTitle())
                .nodeType(menu.getNodeType())
                .iconType(menu.getIconType())
                .iconValue(menu.getIconValue())
                .sort(menu.getSort())
                .createdAt(formatDateTime(menu.getCreateTime()))
                .updatedAt(formatDateTime(menu.getUpdateTime()))
                .build();
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : DATE_TIME_FORMATTER.format(value);
    }
}
