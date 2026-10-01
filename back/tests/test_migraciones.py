from alembic import command


def test_modelos_y_migraciones_coinciden(alembic_cfg):
    # Falla si un modelo cambio y falta la migracion, o si una migracion quedo incompleta.
    command.check(alembic_cfg)


def test_migraciones_se_pueden_revertir_y_volver_a_aplicar(alembic_cfg):
    command.downgrade(alembic_cfg, "base")
    command.upgrade(alembic_cfg, "head")
