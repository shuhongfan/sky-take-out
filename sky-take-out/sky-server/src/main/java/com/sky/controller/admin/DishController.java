package com.sky.controller.admin;

import com.sky.dto.DishDTO;
import com.sky.dto.DishPageQueryDTO;
import com.sky.entity.Dish;
import com.sky.result.PageResult;
import com.sky.result.Result;
import com.sky.service.DishService;
import com.sky.vo.DishVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/admin/dish")
@Api(tags = "菜品相关接口")
@Slf4j
public class DishController {
    @Autowired
    DishService dishService;

    @Autowired
    RedisTemplate redisTemplate;
    @PostMapping
    @ApiOperation("新增菜品")
    public Result save(@RequestBody DishDTO dishDTO){
        log.info("新增菜品:{}",dishDTO);
        String key="dish_"+dishDTO.getCategoryId();
        //作双删防止更新后还未同步redis有数据进行查询（实际上后面这个删除需要做延时）
        clearCache(key);
        dishService.saveWithFlavor(dishDTO);
        //redis缓存数据清除
        clearCache(key);
        return Result.success();
    }

    @GetMapping("/page")
    @ApiOperation("菜品分页查询")
    public Result save(DishPageQueryDTO dishPageQueryDTO){
        log.info("菜品分页查询:{}",dishPageQueryDTO);
        PageResult pageResult=dishService.pageQuery(dishPageQueryDTO);
        return Result.success(pageResult);
    }

    @DeleteMapping
    @ApiOperation("菜品的批量删除")//@RequestParam让springmvc进行参数解析如1，2，3解析为list
    public Result delete(@RequestParam List<Long> ids) {
        log.info("菜品的批量删除:{}",ids);
        dishService.deleteByIds(ids);
        //这里采用粗粒度，将所有分类缓存删除
        clearCache("dish_*");

        return Result.success();
    }

    @GetMapping("/{id}")
    @ApiOperation("根据id查询菜品")
    public Result<DishVO> getById(@PathVariable Long id){
        log.info("根据id查询菜品:{}",id);
        return Result.success(dishService.getById(id));
    }

    @PutMapping
    @ApiOperation("修改菜品")
    public Result update (@RequestBody DishDTO dishDTO){
        log.info("修改菜品:{}",dishDTO);
        dishService.update(dishDTO);
        //这里采用粗粒度，将所有分类缓存删除
        clearCache("dish_*");

        return Result.success();
    }

    @GetMapping("/list")
    @ApiOperation("根据分类id查询菜品")
    public Result getByCategoryId (Long categoryId){
        log.info("根据分类id查询菜品:{}",categoryId);
        List<Dish> result=dishService.getByCategoryId(categoryId);
        return Result.success(result);
    }

    @PostMapping("/status/{status}")
    @ApiOperation("菜品起售停售")
    public Result<String> startOrStop(@PathVariable Integer status, Long id){
        dishService.startOrStop(status,id);

        //这里采用粗粒度，将所有分类缓存删除
        clearCache("dish_*");
        return Result.success();
    }


    private void clearCache(String pattern){
        Set keys = redisTemplate.keys(pattern);
        redisTemplate.delete(keys);
    }

}
