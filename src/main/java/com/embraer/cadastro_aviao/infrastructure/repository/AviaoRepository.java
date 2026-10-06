package com.embraer.cadastro_aviao.infrastructure.repository;

import com.embraer.cadastro_aviao.infrastructure.entitys.Aviao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface AviaoRepository extends JpaRepository<Aviao, Integer> {

    Optional<Aviao> findByFabricante(String fabricante);
    Optional<Aviao> findByNome(String nome);

    @Transactional
    void deleteByNome(String nome);
}
