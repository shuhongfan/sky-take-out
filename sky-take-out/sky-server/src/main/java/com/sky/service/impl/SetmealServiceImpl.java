package com.sky.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sky.constant.MessageConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
import com.sky.dto.SetmealDTO;
import com.sky.dto.SetmealPageQueryDTO;
import com.sky.entity.Dish;
import com.sky.entity.Setmeal;
import com.sky.entity.SetmealDish;
import com.sky.exception.DeletionNotAllowedException;
import com.sky.exception.SetmealEnableFailedException;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealDishMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.result.PageResult;
import com.sky.service.SetmealService;
import com.sky.vo.DishItemVO;
import com.sky.vo.SetmealVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class SetmealServiceImpl implements SetmealService {
    @Autowired
    SetmealMapper setmealMapper;
    @Autowired
    SetmealDishMapper setmealDishMapper;
    @Autowired
    DishMapper dishMapper;


    @Override
    @Transactional
    public void saveWithDish(SetmealDTO setmealDTO) {
        Setmeal setmeal= new Setmeal();
        BeanUtils.copyProperties(setmealDTO,setmeal);
        setmeal.setCreateTime(LocalDateTime.now());
        setmeal.setUpdateTime(LocalDateTime.now());
        setmeal.setCreateUser(BaseContext.getCurrentId());
        setmeal.setUpdateUser(BaseContext.getCurrentId());
        setmealMapper.insert(setmeal);

        List<SetmealDish> setmealDishes = setmealDTO.getSetmealDishes();
        setmealDishes.forEach(setmealDish -> {
            setmealDish.setSetmealId(setmeal.getId());
        });
        setmealDishMapper.insert(setmealDishes);

    }

    @Override
    public PageResult pageQuery(SetmealPageQueryDTO setmealPageQueryDTO) {
        Page page=new Page<>(setmealPageQueryDTO.getPage()-1,setmealPageQueryDTO.getPageSize());
        Page<SetmealVO> setmealPage = setmealMapper.selectSetmealPage(page, setmealPageQueryDTO);
        return new PageResult(setmealPage.getTotal(),setmealPage.getRecords());
    }

    @Override
    public void deleteBatch(List<Long> ids) {
        //删除套餐
        LambdaQueryWrapper<Setmeal> setmealQueryWrapper=new LambdaQueryWrapper<>();
        setmealQueryWrapper.in(Setmeal::getId,ids);
        List<Setmeal> setmeals = setmealMapper.selectList(setmealQueryWrapper);
        setmeals.forEach(setmeal -> {
            if(setmeal.getStatus()== StatusConstant.ENABLE){
                throw new DeletionNotAllowedException(MessageConstant.SETMEAL_ON_SALE);
            }
        });
        setmealMapper.deleteByIds(ids);

        //删除套餐与其关联的套餐菜品表数据
        LambdaQueryWrapper<SetmealDish> setmealDishLambdaQueryWrapper=new LambdaQueryWrapper<>();
        setmealDishLambdaQueryWrapper.in(SetmealDish::getSetmealId,ids);
        setmealDishMapper.delete(setmealDishLambdaQueryWrapper);



    }

    @Override
    public SetmealVO getById(Long id) {
        SetmealVO result=new SetmealVO();
        Setmeal setmeal = setmealMapper.selectById(id);
        BeanUtils.copyProperties(setmeal,result);



        LambdaQueryWrapper<SetmealDish> queryWrapper=new LambdaQueryWrapper<>();
        queryWrapper.eq(SetmealDish::getSetmealId,id);
        List<SetmealDish> setmealDishes = setmealDishMapper.selectList(queryWrapper);
        result.setSetmealDishes(setmealDishes);
        return result;
    }

    @Override
    public void update(SetmealDTO setmealDTO) {
        Setmeal setmeal=new Setmeal();
        BeanUtils.copyProperties(setmealDTO,setmeal);
        setmeal.setUpdateUser(BaseContext.getCurrentId());
        setmeal.setUpdateTime(LocalDateTime.now());
        setmealMapper.updateById(setmeal);

        LambdaQueryWrapper<SetmealDish>queryWrapper=new LambdaQueryWrapper<>();
        queryWrapper.eq(SetmealDish::getSetmealId,setmealDTO.getId());
        setmealDishMapper.delete(queryWrapper);

        List<SetmealDish> setmealDishes = setmealDTO.getSetmealDishes();
        setmealDishes.forEach(setmealDish -> {
            setmealDish.setSetmealId(setmeal.getId());
        });
        setmealDishMapper.insert(setmealDishes);


    }

    @Override
    public void startOrStop(Integer status, Long id) {
        if(Objects.equals(status, StatusConstant.ENABLE)){
            List<Dish> dishList = dishMapper.getBySetmealId(id);
            if(dishList != null && !dishList.isEmpty()){
                dishList.forEach(dish -> {
                    if(StatusConstant.DISABLE == dish.getStatus()){
                        throw new SetmealEnableFailedException(MessageConstant.SETMEAL_ENABLE_FAILED);
                    }
                });
            }
        }

        setmealMapper.update(new LambdaUpdateWrapper<Setmeal>().eq(Setmeal::getId,id)
                .set(Setmeal::getStatus,status));

    }

    @Override
    public List<Setmeal> list(Setmeal setmeal) {
        //根据套餐id和起售状态查询

        LambdaQueryWrapper<Setmeal>setmealLambdaQueryWrapper=new LambdaQueryWrapper<>();
        if(setmeal.getName()==null){
            setmealLambdaQueryWrapper.like(Setmeal::getName,"");
        }else{
            setmealLambdaQueryWrapper.like(Setmeal::getName,setmeal.getName());
        }
        setmealLambdaQueryWrapper.eq(setmeal.getStatus()!=null,Setmeal::getStatus,setmeal.getStatus())
                .eq(setmeal.getStatus()!=null,Setmeal::getCategoryId,setmeal.getCategoryId());
        List<Setmeal> setmeals = setmealMapper.selectList(setmealLambdaQueryWrapper);

        return setmeals;
    }

    @Override
    public List<DishItemVO> getDishItemById(Long id) {

        return setmealMapper.getDishItemBySetmealId(id);
    }
}
