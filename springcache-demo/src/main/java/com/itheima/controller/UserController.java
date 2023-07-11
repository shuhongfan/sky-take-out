package com.itheima.controller;

import com.itheima.entity.User;
import com.itheima.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@Slf4j
public class UserController {

    @Autowired
    private UserMapper userMapper;

    /**
     * 如果使用Spring Cache 缓存数据，key的生成：userCache::1
     * @param user
     * @return
     */
    @PostMapping
    @CachePut(cacheNames = "userCache",key = "#user.id")
//    @CachePut(cacheNames = "userCache",key = "#result.id")
//    @CachePut(cacheNames = "userCache",key = "#p0.id")
//    @CachePut(cacheNames = "userCache",key = "#a0.id")
//    @CachePut(cacheNames = "userCache",key = "#root.args[0].id")
    public User save(@RequestBody User user){
        userMapper.insert(user);
        return user;
    }

    @DeleteMapping
    @CacheEvict(cacheNames = "userCache",key = "#id") //删除某个key对应的缓存数据
    public void deleteById(Long id){
        userMapper.deleteById(id);
    }

	@DeleteMapping("/delAll")
    @CacheEvict(cacheNames = "userCache",allEntries = true) //删除userCache下所有的缓存数据
    public void deleteAll(){
        userMapper.deleteAll();
    }

    @GetMapping
    @Cacheable(cacheNames = "userCache",key = "#id")
    public User getById(Long id){
        User user = userMapper.getById(id);
        return user;
    }

}
