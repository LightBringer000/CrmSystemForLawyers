package ru.ak.lawcrmsystem3.security;

import io.jmix.security.model.EntityAttributePolicyAction;
import io.jmix.security.model.EntityPolicyAction;
import io.jmix.security.role.annotation.*;
import io.jmix.securityflowui.role.annotation.MenuPolicy;
import io.jmix.securityflowui.role.annotation.ViewPolicy;
import ru.ak.lawcrmsystem3.entity.Task;

@ResourceRole(name = "Lawyer Role", code = LawyerRole.CODE)
public interface LawyerRole {

    String CODE = "lawyer-role";

    @EntityPolicy(entityName = "Deal", actions = {EntityPolicyAction.READ, EntityPolicyAction.UPDATE})
    @EntityAttributePolicy(entityName = "Deal", attributes = "*", action = EntityAttributePolicyAction.MODIFY)
    @EntityPolicy(entityName = "Document", actions = {EntityPolicyAction.ALL})
    @EntityAttributePolicy(entityName = "Document", attributes = "*", action = EntityAttributePolicyAction.MODIFY)
    @EntityPolicy(entityName = "Event", actions = {EntityPolicyAction.ALL})
    @EntityAttributePolicy(entityName = "Event", attributes = "*", action = EntityAttributePolicyAction.MODIFY)

    @JpqlRowLevelPolicy(
            entityClass = Task.class,
            where = "{E}.responsibleLawyers = :current_user"
    )
    @EntityPolicy(entityName = "Task_", actions = {EntityPolicyAction.READ, EntityPolicyAction.UPDATE})
    @EntityAttributePolicy(entityName = "Task_", attributes = "*", action = EntityAttributePolicyAction.VIEW)
    @ViewPolicy(
            viewIds = {"Task_.list", "Deal.list", "Task_.detail"})
    @MenuPolicy(
            menuIds = {"Task_.list", "Deal.list"})
    @SpecificPolicy(resources = "*")
    void lawyerAccess();

}