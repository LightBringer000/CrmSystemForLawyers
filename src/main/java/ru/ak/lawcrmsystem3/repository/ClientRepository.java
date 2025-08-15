package ru.ak.lawcrmsystem3.repository;

import io.jmix.core.repository.JmixDataRepository;
import io.jmix.core.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.ak.lawcrmsystem3.entity.Client;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientRepository extends JmixDataRepository<Client, UUID> {

    @Query("SELECT c.email FROM Client c WHERE c.deal.id = :dealId")
    List<String> findEmailsByDealId(@Param("dealId") UUID dealId);
}