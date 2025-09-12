package ru.ak.lawcrmsystem3.security;

import io.jmix.security.model.EntityAttributePolicyAction;
import io.jmix.security.model.EntityPolicyAction;
import io.jmix.security.role.annotation.EntityAttributePolicy;
import io.jmix.security.role.annotation.EntityPolicy;
import io.jmix.security.role.annotation.ResourceRole;
import io.jmix.securityflowui.role.annotation.MenuPolicy;
import io.jmix.securityflowui.role.annotation.ViewPolicy;
import ru.ak.lawcrmsystem3.entity.Task;

@ResourceRole(name = "TestRole", code = TestRole.CODE)
public interface TestRole {
    String CODE = "test-role";

    @EntityPolicy(entityClass = Task.class, actions = {EntityPolicyAction.ALL})
    @EntityAttributePolicy(
            entityClass = Task.class,
            attributes = {"id", "taskTitle", "deadline", "taskPriority",
                    "taskStatus", "responsibleLawyers", "deal", "client"},
            action = EntityAttributePolicyAction.VIEW)
    @ViewPolicy(viewIds = {"Task_.list", "Task_.detail"})
    @MenuPolicy(menuIds = {"Task_.list"})
    void task();
}