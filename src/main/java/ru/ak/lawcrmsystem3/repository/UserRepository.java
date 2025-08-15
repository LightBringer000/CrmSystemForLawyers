package ru.ak.lawcrmsystem3.repository;

import io.jmix.core.repository.JmixDataRepository;
import io.jmix.core.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.ak.lawcrmsystem3.entity.User;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JmixDataRepository<User, UUID> {

    @Query("SELECT u.id FROM User u WHERE u.username = :username")
    UUID findUserIdByUsername(@Param("username") String username);


    @Query("SELECT u.firstName FROM User u WHERE u.username = :username")
    String findFirstNameByUsername(@Param("username") String username);

    Optional<User> findByUsername(String username);

    // Дополнительно можно добавить метод для поиска только ID пользователя
    @Query("select u.id from User u where u.username = :username")
    Optional<UUID> findIdByUsername(@Param("username") String username);

}