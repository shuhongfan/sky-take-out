package com.sky.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sky.constant.MessageConstant;
import com.sky.constant.PasswordConstant;
import com.sky.constant.StatusConstant;
import com.sky.context.BaseContext;
import com.sky.dto.EmployeeDTO;
import com.sky.dto.EmployeeLoginDTO;
import com.sky.dto.EmployeePageQueryDTO;
import com.sky.entity.Employee;
import com.sky.exception.AccountLockedException;
import com.sky.exception.AccountNotFoundException;
import com.sky.exception.PasswordErrorException;
import com.sky.mapper.EmployeeMapper;
import com.sky.result.PageResult;
import com.sky.service.EmployeeService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.time.LocalDateTime;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeMapper employeeMapper;

    /**
     * 员工登录
     *
     * @param employeeLoginDTO
     * @return
     */
    public Employee login(EmployeeLoginDTO employeeLoginDTO) {
        String username = employeeLoginDTO.getUsername();
        String password = employeeLoginDTO.getPassword();

        //1、根据用户名查询数据库中的数据
        Employee employee = employeeMapper.selectOne(new LambdaQueryWrapper<Employee>().eq(Employee::getUsername,username));

        //2、处理各种异常情况（用户名不存在、密码不对、账号被锁定）
        if (employee == null) {
            //账号不存在
            throw new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND);
        }

        //密码比对
        String encode = DigestUtils.md5DigestAsHex(password.getBytes());
        if (!encode.equals(employee.getPassword())) {
            //密码错误
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }

        if (employee.getStatus() == StatusConstant.DISABLE) {
            //账号被锁定
            throw new AccountLockedException(MessageConstant.ACCOUNT_LOCKED);
        }

        //3、返回实体对象
        return employee;
    }

    @Override
    @Transactional
    public void save(EmployeeDTO employeeDTO) {
        Employee employee=new Employee();
        BeanUtils.copyProperties(employeeDTO,employee);

        employee.setCreateTime(LocalDateTime.now());
        employee.setStatus(StatusConstant.ENABLE);
        employee.setUpdateTime(LocalDateTime.now());
        employee.setPassword(DigestUtils.md5DigestAsHex(PasswordConstant.DEFAULT_PASSWORD.getBytes()));
        employee.setCreateUser(BaseContext.getCurrentId());
        employee.setUpdateUser(BaseContext.getCurrentId());

        employeeMapper.insert(employee);


    }

    @Override
    public PageResult list(EmployeePageQueryDTO employeePageQueryDTO) {

        LambdaQueryWrapper<Employee> queryWrapper=new LambdaQueryWrapper<>();
        if(employeePageQueryDTO.getName()==null){
            queryWrapper.like(Employee::getUsername,"");
        }else{
            queryWrapper.like(Employee::getUsername,employeePageQueryDTO.getName());
        }
        queryWrapper.orderByDesc(Employee::getUpdateTime);
        Page<Employee> userPage = new Page<>(employeePageQueryDTO.getPage() -1, employeePageQueryDTO.getPageSize());
        Page<Employee> employeePage = employeeMapper.selectPage(userPage, queryWrapper);

        return new PageResult(employeePage.getTotal(),employeePage.getRecords());
    }

    @Override
    @Transactional
    public void startOrStop(Integer status, Long id) {
        LambdaUpdateWrapper<Employee> updateWrapper=new LambdaUpdateWrapper<>();
        updateWrapper.eq(Employee::getId,id)
                .set(Employee::getStatus,status);
        employeeMapper.update(updateWrapper);
    }

    @Override
    public Employee getById(Long id) {
        Employee employee = employeeMapper.selectById(id);
        employee.setPassword("****");
        return employee;
    }

    @Override
    @Transactional
    public void update(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        BeanUtils.copyProperties(employeeDTO,employee);
        employee.setUpdateTime(LocalDateTime.now());
        employee.setUpdateUser(BaseContext.getCurrentId());
        employeeMapper.updateById(employee);
    }

}
