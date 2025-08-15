package ru.ak.lawcrmsystem3.app;

import io.jmix.core.*;
import io.jmix.core.metamodel.model.MetaClass;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.Client;
import ru.ak.lawcrmsystem3.entity.Deal;
import ru.ak.lawcrmsystem3.repository.ClientRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class DealService {

    private final ClientRepository clientRepository;

    @Autowired
    public DealService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public List<String> getClientEmailsByDealId(UUID dealId) {
        return clientRepository.findEmailsByDealId(dealId);
    }

}