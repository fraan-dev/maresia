package br.edu.ifrn.maresia.report;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

@Entity
@Table(name = "reports")
public class Report {
    @Id private String id;
    @NotBlank private String type;
    @NotBlank private String quantity;
    @NotBlank @Column(length = 500) private String comment;
    @Lob @Column(columnDefinition = "CLOB") private String photo;
    @NotNull private Double lat;
    @NotNull private Double lng;
    @NotBlank private String status;
    @NotNull private Instant createdAt;
    private Instant updatedAt;

    public Report() {}
    public String getId(){return id;} public void setId(String id){this.id=id;}
    public String getType(){return type;} public void setType(String type){this.type=type;}
    public String getQuantity(){return quantity;} public void setQuantity(String quantity){this.quantity=quantity;}
    public String getComment(){return comment;} public void setComment(String comment){this.comment=comment;}
    public String getPhoto(){return photo;} public void setPhoto(String photo){this.photo=photo;}
    public Double getLat(){return lat;} public void setLat(Double lat){this.lat=lat;}
    public Double getLng(){return lng;} public void setLng(Double lng){this.lng=lng;}
    public String getStatus(){return status;} public void setStatus(String status){this.status=status;}
    public Instant getCreatedAt(){return createdAt;} public void setCreatedAt(Instant createdAt){this.createdAt=createdAt;}
    public Instant getUpdatedAt(){return updatedAt;} public void setUpdatedAt(Instant updatedAt){this.updatedAt=updatedAt;}
}
