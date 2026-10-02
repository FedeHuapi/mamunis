import logging

FORMATO = "%(asctime)s %(levelname)s %(name)s: %(message)s"


def configurar_logs(nivel: str) -> None:
    """Prepara los logs de la aplicacion (todo lo que esta bajo el paquete `app`).

    Se configura solo el logger "app" y no el general: asi no se llenan los logs con
    cada consulta SQL de SQLAlchemy ni se pisa la configuracion de uvicorn.

    Regla para todo el proyecto: nunca se loguean contrasenas, tokens ni claves.
    """
    logger = logging.getLogger("app")
    logger.setLevel(nivel)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(FORMATO))
        logger.addHandler(handler)
