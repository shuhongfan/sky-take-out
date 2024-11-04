package com.sky.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sky.constant.MessageConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
import com.sky.dto.DishDTO;
import com.sky.dto.DishPageQueryDTO;
import com.sky.entity.Dish;
import com.sky.entity.DishFlavor;
import com.sky.entity.Setmeal;
import com.sky.entity.SetmealDish;
import com.sky.exception.DeletionNotAllowedException;
import com.sky.mapper.DishFlavorMapper;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealDishMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.result.PageResult;
import com.sky.service.DishService;
import com.sky.vo.DishVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class DishServiceImpl implements DishService {
    @Autowired
    DishMapper dishMapper;
    @Autowired
    DishFlavorMapper dishFlavorMapper;
    @Autowired
    SetmealDishMapper setmealDishMapper;
    @Autowired
    SetmealMapper setmealMapper;
    @Override
    @Transactional
    public void saveWithFlavor(DishDTO dishDTO) {
        Dish dish = new Dish();
        BeanUtils.copyProperties(dishDTO,dish);
        dish.setCreateTime(LocalDateTime.now());
        dish.setUpdateTime(LocalDateTime.now());
        dish.setCreateUser(BaseContext.getCurrentId());
        dish.setUpdateUser(BaseContext.getCurrentId());
        dishMapper.insert(dish);


       List<DishFlavor> flavors = dishDTO.getFlavors();
        if(flavors!=null&& !flavors.isEmpty()){
            flavors.forEach(dishFlavor->{
                dishFlavor.setDishId(dish.getId());
            });
            dishFlavorMapper.insert(flavors);
        }
    }

    @Override
    public PageResult pageQuery(DishPageQueryDTO dishPageQueryDTO) {
        Page<DishVO> page=new Page<>(dishPageQueryDTO.getPage()-1,dishPageQueryDTO.getPageSize());
        Page<DishVO> resultPage = dishMapper.selectDishPage(page, dishPageQueryDTO);
        return new PageResult(resultPage.getTotal(),resultPage.getRecords());
    }

    @Override
    @Transactional
    public void deleteByIds(List<Long> ids) {
        LambdaQueryWrapper<Dish> dishQueryWrapper=new LambdaQueryWrapper<>();
        dishQueryWrapper.in(Dish::getId,ids);
//        //判断商品是否能删除（是否在售出）
//        for (Long id :ids){
//            Dish dish = dishMapper.selectById(id);
//            if(dish.getStatus()== StatusConstant.ENABLE){
//                throw new DeletionNotAllowedException(MessageConstant.DISH_ON_SALE);
//            }
//        }
        List<Dish> dishes = dishMapper.selectList(dishQueryWrapper);
        for(Dish dish :dishes){
            if(dish.getStatus()== StatusConstant.ENABLE){
               throw new DeletionNotAllowedException(MessageConstant.DISH_ON_SALE);
            }
        }

        //判断是否被套餐关联
        LambdaQueryWrapper<SetmealDish> setmealDishQueryWrapper=new LambdaQueryWrapper<>();
        setmealDishQueryWrapper.in(SetmealDish::getDishId,ids);
        List<SetmealDish> setmealDishes = setmealDishMapper.selectList(setmealDishQueryWrapper);
        if(setmealDishes!=null&&!setmealDishes.isEmpty()){
            throw new DeletionNotAllowedException(MessageConstant.DISH_BE_RELATED_BY_SETMEAL);
        }

        //删除菜品数据
        dishMapper.deleteByIds(ids);
        //删除口味数据
        LambdaQueryWrapper<DishFlavor> dishFlavorQueryWrapper=new LambdaQueryWrapper<>();
        dishFlavorQueryWrapper.in(DishFlavor::getDishId,ids);
        dishFlavorMapper.delete(dishFlavorQueryWrapper);
    }

    @Override
    public DishVO getById(Long id) {
        Dish dish = dishMapper.selectById(id);
        LambdaQueryWrapper<DishFlavor> dishFlavorQueryWrapper=new LambdaQueryWrapper<>();
        dishFlavorQueryWrapper.eq(DishFlavor::getDishId,id);
        List<DishFlavor> dishFlavors = dishFlavorMapper.selectList(dishFlavorQueryWrapper);
        DishVO dishVO=new DishVO();
        BeanUtils.copyProperties(dish,dishVO);
        dishVO.setFlavors(dishFlavors);

        return dishVO;
    }

    @Override
    @Transactional
    public void update(DishDTO dishDTO) {
        Dish dish = new Dish();
        BeanUtils.copyProperties(dishDTO,dish);
        dish.setUpdateTime(LocalDateTime.now());
        dish.setUpdateUser(BaseContext.getCurrentId());
        dishMapper.updateById(dish);

        dishFlavorMapper.delete(new LambdaQueryWrapper<DishFlavor>().eq(DishFlavor::getDishId,dishDTO.getId()));
        List<DishFlavor> flavors = dishDTO.getFlavors();
        if(flavors!=null&& !flavors.isEmpty()){
            flavors.forEach(dishFlavor->{
                dishFlavor.setDishId(dish.getId());
            });
            dishFlavorMapper.insert(flavors);
        }


    }

    @Override
    public List<Dish> getByCategoryId(Long categoryId) {
        return dishMapper.selectList(new LambdaQueryWrapper<Dish>().eq(Dish::getCategoryId,categoryId)
                .eq(Dish::getStatus,StatusConstant.ENABLE)
                .orderByDesc(Dish::getUpdateTime));
    }

    @Override
    public List<DishVO> listWithFlavor(Dish dish) {
        //分类id和状态
         LambdaQueryWrapper<Dish> dishLambdaQueryWrapper=new LambdaQueryWrapper<>();
         dishLambdaQueryWrapper.eq(Dish::getStatus,dish.getStatus())
                 .eq(Dish::getCategoryId,dish.getCategoryId());
        List<Dish> dishes = dishMapper.selectList(dishLambdaQueryWrapper);
        List<DishVO> dishVOList = new ArrayList<>();
        for (Dish d : dishes) {
            DishVO dishVO = new DishVO();
            BeanUtils.copyProperties(d,dishVO);

            //根据菜品id查询对应的口味
            List<DishFlavor> flavors = dishFlavorMapper.selectList(
                    new LambdaQueryWrapper<DishFlavor>().eq(DishFlavor::getDishId, d.getId()));

            dishVO.setFlavors(flavors);
            dishVOList.add(dishVO);
        }
        return dishVOList;
    }

    @Override
    public void startOrStop(Integer status, Long id) {
        dishMapper.update(new LambdaUpdateWrapper<Dish>().eq(Dish::getId,id)
                .set(Dish::getStatus,status));
        if (status == StatusConstant.DISABLE) {
            // 如果是停售操作，还需要将包含当前菜品的套餐也停售
            List<SetmealDish> setmealDishes = setmealDishMapper.selectList(new LambdaQueryWrapper<SetmealDish>().eq(SetmealDish::getDishId,id));
            List<Long>setmealId=new ArrayList<>();
            setmealDishes.forEach(setmealDish -> {
                setmealId.add(setmealDish.getSetmealId());
            });
            setmealMapper.update(new LambdaUpdateWrapper<Setmeal>().in(Setmeal::getId,setmealId)
                    .set(Setmeal::getStatus,StatusConstant.DISABLE));
        }

    }
}
