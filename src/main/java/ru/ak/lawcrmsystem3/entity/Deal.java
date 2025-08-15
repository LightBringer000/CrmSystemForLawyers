package ru.ak.lawcrmsystem3.entity;

import io.jmix.core.annotation.DeletedBy;
import io.jmix.core.annotation.DeletedDate;
import io.jmix.core.entity.annotation.JmixGeneratedValue;
import io.jmix.core.metamodel.annotation.InstanceName;
import io.jmix.core.metamodel.annotation.JmixEntity;
import io.jmix.data.DdlGeneration;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.OffsetDateTime;
import java.util.*;

@DdlGeneration(value = DdlGeneration.DbScriptGenerationMode.CREATE_ONLY)
@JmixEntity
@Table(name = "DEAL", uniqueConstraints = {
        @UniqueConstraint(name = "IDX_DEAL_UNQ_TITLE", columnNames = {"TITLE"})
})
@Entity
public class Deal {
    @JmixGeneratedValue
    @Column(name = "ID", nullable = false)
    @Id
    private UUID id;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceRendered> servicesRendered;

    @ManyToMany
    @JoinTable(
            name = "deal_client", // Название соединяющей таблицы
            joinColumns = @JoinColumn(name = "deal_id"), // Колонка в соединяющей таблице, ссылающаяся на Deal
            inverseJoinColumns = @JoinColumn(name = "client_id") // Колонка в соединяющей таблице, ссылающаяся на Client
    )
    private List<Client> clients = new ArrayList<>();

    @NotBlank(message = "Название обязательно")
    @InstanceName
    @Column(name = "TITLE")
    private String title;

    @Column(name = "DEAL_NUMBER")
    private String dealNumber;

    @Column(name = "STARTED_AT")
    private OffsetDateTime startedAt;

    @Column(name = "FINISHED_AT")
    private OffsetDateTime finishedAt;

    @JoinTable(name = "DEAL_USER_LINK",
            joinColumns = @JoinColumn(name = "DEAL_ID", referencedColumnName = "ID"),
            inverseJoinColumns = @JoinColumn(name = "USER_ID", referencedColumnName = "ID"))
    @ManyToMany
    private Set<User> responsibleLawyer;

    @Column(name = "DESCRIPTION", length = 2500)
    private String description;

    @Column(name = "DEAL_STATUS")
    private String dealStatus;

    @OrderBy("ASC")
    @OneToMany(mappedBy = "deal")
    private List<Document> relatedDocuments;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Event> events;

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

    @JoinTable(name = "DEAL_PARTICIPANT_DEAL_LINK",
            joinColumns = @JoinColumn(name = "DEAL_ID", referencedColumnName = "ID"),
            inverseJoinColumns = @JoinColumn(name = "DEAL_PARTICIPANT_ID", referencedColumnName = "ID"))
    @ManyToMany
    private Set<DealParticipant> dealParticipants;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Process> processes = new ArrayList<>();

    public List<ServiceRendered> getServicesRendered() {
        return servicesRendered;
    }

    public void setServicesRendered(List<ServiceRendered> servicesRendered) {
        this.servicesRendered = servicesRendered;
    }

    public DealStatus getDealStatus() {
        return dealStatus == null ? null : DealStatus.fromId(dealStatus);
    }

    public void setDealStatus(DealStatus dealStatus) {
        this.dealStatus = dealStatus == null ? null : dealStatus.getId();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public OffsetDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(OffsetDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(OffsetDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public String getDealNumber() {
        return dealNumber;
    }

    public void setDealNumber(String dealNumber) {
        this.dealNumber = dealNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<Client> getClients() {
    return clients;
}

    public void setClients(List<Client> clients) {
        this.clients = clients;
    }

    public List<Document> getRelatedDocuments() {
        return relatedDocuments;
    }

    public void setRelatedDocuments(List<Document> relatedDocuments) {
        this.relatedDocuments = relatedDocuments;
    }

    public Set<DealParticipant> getDealParticipants() {
        return dealParticipants;
    }

    public void setDealParticipants(Set<DealParticipant> dealParticipants) {
        this.dealParticipants = dealParticipants;
    }

    public Set<User> getResponsibleLawyer() {
        return responsibleLawyer;
    }

    public void setResponsibleLawyer(Set<User> responsibleLawyer) {
        this.responsibleLawyer = responsibleLawyer;
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

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public List<Event> getEvents() {
        return events;
    }

    public void setEvents(List<Event> events) {
        this.events = events;
    }

    public List<Process> getProcesses() {
        return processes;
    }

    public void setProcesses(List<Process> processes) {
        this.processes = processes;
    }
}