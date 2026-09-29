from app.core.limitador import LimitadorDeIntentos


class RelojFalso:
    def __init__(self):
        self.ahora = 1000.0

    def __call__(self):
        return self.ahora

    def adelantar(self, segundos):
        self.ahora += segundos


def _limitador(reloj, max_intentos=3, ventana=60):
    return LimitadorDeIntentos(max_intentos=max_intentos, ventana_segundos=ventana, reloj=reloj)


def test_no_bloquea_antes_del_maximo():
    limitador = _limitador(RelojFalso())
    for _ in range(2):
        limitador.registrar_fallo("x")

    assert limitador.segundos_de_bloqueo("x") == 0


def test_bloquea_al_llegar_al_maximo():
    reloj = RelojFalso()
    limitador = _limitador(reloj)
    for _ in range(3):
        limitador.registrar_fallo("x")

    assert limitador.segundos_de_bloqueo("x") == 60


def test_se_desbloquea_cuando_pasa_la_ventana():
    reloj = RelojFalso()
    limitador = _limitador(reloj)
    for _ in range(3):
        limitador.registrar_fallo("x")

    reloj.adelantar(59)
    assert limitador.segundos_de_bloqueo("x") == 1
    reloj.adelantar(1)
    assert limitador.segundos_de_bloqueo("x") == 0


def test_la_ventana_es_deslizante():
    reloj = RelojFalso()
    limitador = _limitador(reloj)
    limitador.registrar_fallo("x")
    reloj.adelantar(30)
    limitador.registrar_fallo("x")
    limitador.registrar_fallo("x")

    reloj.adelantar(30)  # el primer fallo ya vencio, quedan 2 dentro de la ventana
    assert limitador.segundos_de_bloqueo("x") == 0


def test_claves_independientes():
    limitador = _limitador(RelojFalso())
    for _ in range(3):
        limitador.registrar_fallo("x")

    assert limitador.segundos_de_bloqueo("otra") == 0


def test_reiniciar_limpia_los_fallos():
    limitador = _limitador(RelojFalso())
    for _ in range(3):
        limitador.registrar_fallo("x")

    limitador.reiniciar("x")

    assert limitador.segundos_de_bloqueo("x") == 0


def test_purga_claves_vencidas_al_llegar_al_tope():
    reloj = RelojFalso()
    limitador = _limitador(reloj)
    limitador.MAX_CLAVES = 3
    for clave in ["a", "b", "c"]:
        limitador.registrar_fallo(clave)

    reloj.adelantar(61)
    limitador.registrar_fallo("d")

    assert set(limitador._fallos) == {"d"}
