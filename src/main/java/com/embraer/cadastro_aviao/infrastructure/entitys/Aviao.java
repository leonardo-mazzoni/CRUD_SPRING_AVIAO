//seria nosso dto
package com.embraer.cadastro_aviao.infrastructure.entitys;
import jakarta.persistence.*;
import lombok.*;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "aviao")
@Entity
public class Aviao {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @Column(name = "nome")
    private String nome;

    @Column(name = "modelo")
    private String modelo;

    @Column(name = "fabricante")
    private String fabricante;

    @Column(name = "autonomia")
    private Integer autonomia;

    @Column(name = "capacidade")
    private Integer capacidade;
}
