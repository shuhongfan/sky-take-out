package com.sky.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sky.context.BaseContext;
import com.sky.dto.ShoppingCartDTO;
import com.sky.entity.Dish;
import com.sky.entity.Setmeal;
import com.sky.entity.ShoppingCart;
import com.sky.mapper.DishMapper;
import com.sky.mapper.SetmealMapper;
import com.sky.mapper.ShoppingCartMapper;
import com.sky.service.ShoppingCartService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShoppingCartServiceImpl implements ShoppingCartService {
    @Autowired
    ShoppingCartMapper shoppingCartMapper;
    @Autowired
    DishMapper dishMapper;
    @Autowired
    SetmealMapper setmealMapper;
    @Override
    public void addShoppingCart(ShoppingCartDTO shoppingCartDTO) {

        ShoppingCart shoppingCart=new ShoppingCart();
        BeanUtils.copyProperties(shoppingCartDTO,shoppingCart);
        shoppingCart.setUserId(BaseContext.getCurrentId());

        LambdaQueryWrapper<ShoppingCart> queryWrapper=new LambdaQueryWrapper<>();
        queryWrapper.eq(shoppingCart.getUserId()!=null,ShoppingCart::getUserId,shoppingCart.getUserId())
                .eq(shoppingCart.getSetmealId()!=null,ShoppingCart::getSetmealId,shoppingCart.getSetmealId())
                .eq(shoppingCart.getDishId()!=null,ShoppingCart::getDishId,shoppingCart.getDishId())
                .eq(shoppingCart.getDishFlavor()!=null,ShoppingCart::getDishFlavor,shoppingCart.getDishFlavor());
        ShoppingCart object = shoppingCartMapper.selectOne(queryWrapper);
        if(object!=null){
            object.setNumber(object.getNumber()+1);
            shoppingCartMapper.updateById(object);
        }else{
            //判断是菜品还是套餐
            Long dishId = shoppingCartDTO.getDishId();
            Long setmealId = shoppingCartDTO.getSetmealId();
            if(dishId!=null){
                //添加到购物车的是菜品
                Dish dish = dishMapper.selectById(dishId);
                shoppingCart.setName(dish.getName());
                shoppingCart.setImage(dish.getImage());
                shoppingCart.setAmount(dish.getPrice());
            }else {
                //添加的是套餐
                Setmeal setmeal = setmealMapper.selectById(setmealId);
                shoppingCart.setName(setmeal.getName());
                shoppingCart.setImage(setmeal.getImage());
                shoppingCart.setAmount(setmeal.getPrice());
            }

            shoppingCart.setNumber(1);
            shoppingCart.setCreateTime(LocalDateTime.now());
            shoppingCartMapper.insert(shoppingCart);
        }

    }

    @Override
    public List<ShoppingCart> list() {
        return shoppingCartMapper.selectList(new LambdaQueryWrapper<ShoppingCart>().eq(ShoppingCart::getUserId,BaseContext.getCurrentId()));
    }

    @Override
    public void clean() {
        shoppingCartMapper.delete(new LambdaQueryWrapper<ShoppingCart>().eq(ShoppingCart::getUserId,BaseContext.getCurrentId()));
    }

    @Override
    public void subShoppingCart(ShoppingCartDTO shoppingCartDTO) {
        LambdaQueryWrapper<ShoppingCart> queryWrapper=new LambdaQueryWrapper<>();
        queryWrapper.eq(BaseContext.getCurrentId()!=null,ShoppingCart::getUserId,BaseContext.getCurrentId())
                .eq(shoppingCartDTO.getSetmealId()!=null,ShoppingCart::getSetmealId,shoppingCartDTO.getSetmealId())
                .eq(shoppingCartDTO.getDishId()!=null,ShoppingCart::getDishId,shoppingCartDTO.getDishId())
                .eq(shoppingCartDTO.getDishFlavor()!=null,ShoppingCart::getDishFlavor,shoppingCartDTO.getDishFlavor());
        ShoppingCart shoppingCart = shoppingCartMapper.selectOne(queryWrapper);
        if(shoppingCart.getNumber()==1){
            shoppingCartMapper.deleteById(shoppingCart);
        }else{
            shoppingCart.setNumber(shoppingCart.getNumber()-1);
            shoppingCartMapper.updateById(shoppingCart);
        }

    }
}
