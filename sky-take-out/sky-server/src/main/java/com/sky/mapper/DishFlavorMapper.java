package com.sky.mapper;

import com.sky.annotation.AutoFill;
import com.sky.entity.DishFlavor;
import com.sky.enumeration.OperationType;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface DishFlavorMapper {
//    批量插入口味数据
    void insertBatch(List<DishFlavor> flavors);

//    删除菜单关联的口味数据
    void deleteByDishId(Long id);

//    根据菜品id查询口味数据
    List<DishFlavor> getByDishId(Long id);
}
