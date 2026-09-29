import math
import threading
import time
from collections import deque


class LimitadorDeIntentos:
    """Cuenta intentos fallidos por clave dentro de una ventana de tiempo deslizante.

    Vive en memoria: se reinicia con el servidor y no se comparte entre varias
    instancias. Alcanza para un unico servidor; con varios, habria que usar Redis.
    """

    MAX_CLAVES = 10_000

    def __init__(self, max_intentos: int, ventana_segundos: float, reloj=time.monotonic):
        self.max_intentos = max_intentos
        self.ventana = ventana_segundos
        self._reloj = reloj
        self._fallos: dict[str, deque[float]] = {}
        # Los endpoints sincronos de FastAPI corren en varios hilos a la vez.
        self._lock = threading.Lock()

    def segundos_de_bloqueo(self, clave: str) -> int:
        with self._lock:
            ahora = self._reloj()
            fallos = self._fallos_vigentes(clave, ahora)
            if len(fallos) < self.max_intentos:
                return 0
            return math.ceil(self.ventana - (ahora - fallos[0]))

    def registrar_fallo(self, clave: str) -> None:
        with self._lock:
            ahora = self._reloj()
            if len(self._fallos) >= self.MAX_CLAVES:
                self._purgar_vencidos(ahora)
            self._fallos.setdefault(clave, deque()).append(ahora)

    def reiniciar(self, clave: str) -> None:
        with self._lock:
            self._fallos.pop(clave, None)

    def reiniciar_todo(self) -> None:
        with self._lock:
            self._fallos.clear()

    def _fallos_vigentes(self, clave: str, ahora: float) -> deque[float]:
        fallos = self._fallos.get(clave, deque())
        while fallos and ahora - fallos[0] >= self.ventana:
            fallos.popleft()
        if not fallos:
            self._fallos.pop(clave, None)
        return fallos

    def _purgar_vencidos(self, ahora: float) -> None:
        for clave in list(self._fallos):
            self._fallos_vigentes(clave, ahora)


QUINCE_MINUTOS = 15 * 60
intentos_login_por_cuenta = LimitadorDeIntentos(max_intentos=5, ventana_segundos=QUINCE_MINUTOS)
intentos_login_por_ip = LimitadorDeIntentos(max_intentos=20, ventana_segundos=QUINCE_MINUTOS)
