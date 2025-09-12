package ru.ak.lawcrmsystem3.security;

import io.jmix.core.security.CurrentAuthentication;
import io.jmix.security.model.RowLevelBiPredicate;
import io.jmix.security.model.RowLevelPolicyAction;
import io.jmix.security.model.RowLevelPredicate;
import io.jmix.security.role.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import ru.ak.lawcrmsystem3.entity.Task;
import ru.ak.lawcrmsystem3.entity.User;

import java.util.function.Predicate;

@RowLevelRole(name = "LawyerTasksRowsRole", code = LawyerTasksRowsRole.CODE)
public interface LawyerTasksRowsRole {

    Logger log = LoggerFactory.getLogger(LawyerTasksRowsRole.class);


    String CODE = "lawyer-tasks-rows-role";

//    @JpqlRowLevelPolicy(
//            entityClass = Task.class,
//            join = "join {E}.responsibleLawyers rl",
//            where = "rl.username = :current_user_username")
//    void taskJpql();

//
//    @PredicateRowLevelPolicy(entityClass = Task.class,
//            actions = {RowLevelPolicyAction.READ})
//    default RowLevelBiPredicate<Task, ApplicationContext> taskPredicate() {
//        return (task, applicationContext) -> {
//            CurrentAuthentication currentAuthentication = applicationContext.getBean(CurrentAuthentication.class);
//            log.info("Applying predicate row-level policy for tasks.");
//
//            if (currentAuthentication.isSet()) {
//                Object user = currentAuthentication.getUser();
//                log.info("Authentication is set. Current user: {}", user);
//                if (user instanceof User) {
//                    User currentUser = (User) user;
//                    log.info("User is an instance of 'User'. Filtering tasks for user: {}", currentUser.getUsername());
//                    return task.getResponsibleLawyers().contains(currentUser);
//                }
//            } else {
//                log.info("Authentication is not set. Hiding all tasks.");
//            }
//            return false;
//        };
//    }

    @PredicateRowLevelPolicy(entityClass = Task.class,
            actions = {RowLevelPolicyAction.READ})
    default RowLevelBiPredicate<Task, ApplicationContext> taskPredicate() {
        return (task, applicationContext) -> {
            CurrentAuthentication currentAuthentication = applicationContext.getBean(CurrentAuthentication.class);
            if (currentAuthentication.isSet()) {
                Object user = currentAuthentication.getUser();
                if (user instanceof User currentUser) {
                    return task.getResponsibleLawyers().contains(currentUser);
                }
            }
            return false;
        };
    }

}