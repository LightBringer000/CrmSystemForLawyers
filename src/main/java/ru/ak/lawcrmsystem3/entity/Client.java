package ru.ak.lawcrmsystem3.entity;

import io.jmix.core.DeletePolicy;
import io.jmix.core.annotation.DeletedBy;
import io.jmix.core.annotation.DeletedDate;
import io.jmix.core.entity.annotation.JmixGeneratedValue;
import io.jmix.core.entity.annotation.OnDelete;
import io.jmix.core.metamodel.annotation.InstanceName;
import io.jmix.core.metamodel.annotation.JmixEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.OffsetDateTime;
import java.util.*;

@JmixEntity
@Table(name = "CLIENT", indexes = {
        @Index(name = "IDX_CLIENT_DEAL", columnList = "DEAL_ID")
})
@Entity
public class Client {
    @JmixGeneratedValue
    @Column(name = "ID", nullable = false)
    @Id
    private UUID id;

    @InstanceName
    @Column(name = "NAME")
    private String name;

    @OnDelete(DeletePolicy.CASCADE)
    @OrderBy("ASC")
    @OneToMany(mappedBy = "client")
    private List<InteractionsHistory> interactionsHistory;

    @Column(name = "ADDRESS")
    private String address;

    @Email(message = "Неверный формат адреса электронной почты", regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
    @Column(name = "EMAIL")
    private String email;

    @NotBlank(message = "Поле не может быть пустым")
    @Column(name = "PHONE_NUMBER")
    private String phoneNumber;

    @Column(name = "OTHER_INFO", length = 2500)
    private String otherInfo;

    @Column(name = "VERSION", nullable = false)
    @Version
    private Integer version;

    @CreatedBy
    @Column(name = "CREATED_BY")
    private String createdBy;

    @CreatedDate
    @Column(name = "CREATED_DATE")
    private OffsetDateTime createdDate;

    @LastModifiedBy
    @Column(name = "LAST_MODIFIED_BY")
    private String lastModifiedBy;

    @LastModifiedDate
    @Column(name = "LAST_MODIFIED_DATE")
    private OffsetDateTime lastModifiedDate;

    @DeletedBy
    @Column(name = "DELETED_BY")
    private String deletedBy;

    @DeletedDate
    @Column(name = "DELETED_DATE")
    private OffsetDateTime deletedDate;

    @ManyToMany(mappedBy = "clients")
    //private Set<Deal> deals = new HashSet<>();
    private List<Deal> deals = new ArrayList<>();

    @Column(name = "CLIENT_CATEGORY")
    private String clientCategory;
    @Column(name = "CLIENT_STATUS")
    private String clientStatus;

    public List<InteractionsHistory> getInteractionsHistory() {
        return interactionsHistory;
    }

    public void setInteractionsHistory(List<InteractionsHistory> interactionsHistory) {
        this.interactionsHistory = interactionsHistory;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ClientStatus getClientStatus() {
        return clientStatus == null ? null : ClientStatus.fromId(clientStatus);
    }

    public void setClientStatus(ClientStatus clientStatus) {
        this.clientStatus = clientStatus == null ? null : clientStatus.getId();
    }

    public ClientCategory getClientCategory() {
        return clientCategory == null ? null : ClientCategory.fromId(clientCategory);
    }

    public void setClientCategory(ClientCategory clientCategory) {
        this.clientCategory = clientCategory == null ? null : clientCategory.getId();
    }

    public String getOtherInfo() {
        return otherInfo;
    }

    public void setOtherInfo(String otherInfo) {
        this.otherInfo = otherInfo;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public List<Deal> getDeals() {
    return deals;
}

    public void setDeals(List<Deal> deals) {
        this.deals = deals;
    }

    public OffsetDateTime getDeletedDate() {
        return deletedDate;
    }

    public void setDeletedDate(OffsetDateTime deletedDate) {
        this.deletedDate = deletedDate;
    }

    public String getDeletedBy() {
        return deletedBy;
    }

    public void setDeletedBy(String deletedBy) {
        this.deletedBy = deletedBy;
    }

    public OffsetDateTime getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(OffsetDateTime lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public OffsetDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(OffsetDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }
}