package com.sky.mapper;

import com.github.pagehelper.Page;
import com.sky.annotation.AutoFill;
import com.sky.dto.EmployeePageQueryDTO;
import com.sky.entity.Employee;
import com.sky.enumeration.OperationType;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface EmployeeMapper {

    /**
     * 根据用户名查询员工
     * @param username
     * @return
     */
    Employee getByUsername(@Param("username") String username);

    /**
     * 插入员工数据
     * @param employee
     */
    @AutoFill(OperationType.INSERT)
    void insert(Employee employee);

    /**
     * 员工分页查询
     * @param employeePageQueryDTO
     * @return
     */
    Page<Employee> pageQuery(EmployeePageQueryDTO employeePageQueryDTO);

    /**
     * 启用禁用员工账户,编辑员工信息
     * @param employee
     */
    @AutoFill(OperationType.UPDATE)
    void update(Employee employee);

    /**
     * 根据iD查询用户信息
     * @param id
     * @return
     */
    Employee getById(@Param("id") Long id);

}
