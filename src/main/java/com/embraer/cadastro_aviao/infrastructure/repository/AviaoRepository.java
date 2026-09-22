package com.embraer.cadastro_aviao.infrastructure.repository;

import com.embraer.cadastro_aviao.infrastructure.entitys.Aviao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AviaoRepository extends JpaRepository<Aviao, Integer> {

    Optional<Aviao> findByFabricante(String fabricante);

}
