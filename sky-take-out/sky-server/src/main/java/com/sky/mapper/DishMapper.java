package com.sky.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sky.dto.DishPageQueryDTO;
import com.sky.entity.Dish;
import com.sky.vo.DishVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper

public interface DishMapper extends BaseMapper<Dish> {

    //    /**
//     * 根据分类id查询菜品数量
//     * @param categoryId
//     * @return
//     */
//    @Select("select count(id) from dish where category_id = #{categoryId}")
//    Integer countByCategoryId(Long categoryId);

    Page<DishVO> selectDishPage(Page<DishVO> page, @Param("dish") DishPageQueryDTO dishPageQueryDTO);

    List<Dish> getBySetmealId(Long id);


    Integer countByMap(Map map);
}
