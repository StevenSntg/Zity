"""
Genera el PDF de artefactos Scrum del Sprint 5 (Zity).
Estilo visual: cabecera azul con título centrado, tablas tipo zebra,
secciones numeradas con banda de color, footer con número de página.

Uso:
    python scripts/generate_sprint5_pdf.py

Salida:
    docs/sprints/Zity_Sprint5_Artefactos.pdf
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


# ─── Paleta y constantes de estilo ────────────────────────────────────────────
# Paleta inspirada en publicaciones académicas: azul Oxford profundo +
# neutros cálidos. Alto contraste para texto, tintes suaves para fondos.

ZITY_BLUE = colors.HexColor("#1d3a5f")          # Azul Oxford — banners y headers
ZITY_BLUE_DARK = colors.HexColor("#142948")     # Acento profundo — títulos
ZITY_BLUE_LIGHT = colors.HexColor("#e5edf5")    # Fondo suave azulado
ZITY_LABEL_BG = colors.HexColor("#eef1f4")      # Fondo de etiquetas info_table
ZITY_BG_SOFT = colors.HexColor("#f7f8fa")       # Zebra muy sutil
ZITY_BG_QUOTE = colors.HexColor("#f0f4f9")      # Quote/sprint goal box
ZITY_BORDER = colors.HexColor("#d8dde3")        # Bordes finos generales
ZITY_BORDER_LIGHT = colors.HexColor("#e8ebef")  # Líneas internas tabla
ZITY_TEXT = colors.HexColor("#1c2330")          # Cuerpo de texto principal
ZITY_TEXT_MUTED = colors.HexColor("#5b6878")    # Texto secundario / metadata
ZITY_OK = colors.HexColor("#1e7e34")
ZITY_WARN = colors.HexColor("#a87800")
ZITY_FAIL = colors.HexColor("#a83232")

PAGE_W, PAGE_H = LETTER
LEFT_MARGIN = RIGHT_MARGIN = 0.75 * inch
TOP_MARGIN = 0.85 * inch
BOTTOM_MARGIN = 0.75 * inch


# ─── Stylesheet ───────────────────────────────────────────────────────────────


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    styles: dict[str, ParagraphStyle] = {}

    # ── Portada ────────────────────────────────────────────────────────────
    styles["TitleCover"] = ParagraphStyle(
        "TitleCover",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=46,
        leading=52,
        alignment=TA_CENTER,
        textColor=ZITY_BLUE_DARK,
        spaceAfter=4,
    )
    styles["SubtitleCover"] = ParagraphStyle(
        "SubtitleCover",
        parent=base["Heading2"],
        fontName="Helvetica",
        fontSize=18,
        leading=24,
        alignment=TA_CENTER,
        textColor=ZITY_BLUE,
        spaceAfter=6,
    )
    styles["TaglineCover"] = ParagraphStyle(
        "TaglineCover",
        parent=base["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=11,
        leading=16,
        alignment=TA_CENTER,
        textColor=ZITY_TEXT_MUTED,
        spaceAfter=26,
    )

    # ── Banners de sección (texto blanco sobre franja azul) ───────────────
    styles["SectionBanner"] = ParagraphStyle(
        "SectionBanner",
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=18,
        textColor=colors.white,
        spaceBefore=0,
        spaceAfter=0,
        leftIndent=4,
        letterSpace=0.5,
    )

    # ── Encabezados ────────────────────────────────────────────────────────
    styles["H2"] = ParagraphStyle(
        "H2",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=18,
        textColor=ZITY_BLUE_DARK,
        spaceBefore=16,
        spaceAfter=8,
    )
    styles["H3"] = ParagraphStyle(
        "H3",
        parent=base["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=ZITY_BLUE,
        spaceBefore=12,
        spaceAfter=4,
    )

    # ── Texto corrido ──────────────────────────────────────────────────────
    styles["Body"] = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=ZITY_TEXT,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
    )
    styles["BodyLeft"] = ParagraphStyle(
        "BodyLeft",
        parent=styles["Body"],
        alignment=TA_LEFT,
        spaceAfter=6,
    )

    # ── Celdas de tabla ────────────────────────────────────────────────────
    styles["Cell"] = ParagraphStyle(
        "Cell",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=ZITY_TEXT,
        alignment=TA_LEFT,
    )
    styles["CellBold"] = ParagraphStyle(
        "CellBold",
        parent=styles["Cell"],
        fontName="Helvetica-Bold",
        textColor=ZITY_BLUE_DARK,
    )
    # Cabecera de tabla grilla (texto blanco sobre fondo azul oscuro)
    styles["CellHeader"] = ParagraphStyle(
        "CellHeader",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white,
        alignment=TA_LEFT,
        letterSpace=0.3,
    )
    # NUEVO — etiqueta de info_table (texto oscuro sobre fondo claro)
    # Antes se reusaba CellHeader (texto blanco) → invisible sobre tinte claro.
    styles["CellLabel"] = ParagraphStyle(
        "CellLabel",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=ZITY_BLUE_DARK,
        alignment=TA_LEFT,
        letterSpace=0.2,
    )

    # ── Quote / Sprint Goal ────────────────────────────────────────────────
    # ParagraphStyle plano. El background/border los aplica el helper
    # `quote_box()` vía Table — combinar borderPadding + backColor en un
    # Paragraph hace que ReportLab calcule mal el wrapHeight y la caja se
    # pinte sobre el H2 anterior.
    styles["Quote"] = ParagraphStyle(
        "Quote",
        parent=styles["Body"],
        fontName="Helvetica-BoldOblique",
        fontSize=10.5,
        leading=16,
        alignment=TA_CENTER,
        textColor=ZITY_BLUE_DARK,
        spaceBefore=0,
        spaceAfter=0,
    )

    # ── Notas y pie ────────────────────────────────────────────────────────
    styles["Note"] = ParagraphStyle(
        "Note",
        parent=base["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=13,
        textColor=ZITY_TEXT_MUTED,
        spaceBefore=2,
        spaceAfter=10,
    )
    styles["Footer"] = ParagraphStyle(
        "Footer",
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11,
        textColor=ZITY_TEXT_MUTED,
        alignment=TA_CENTER,
    )

    # ── Etiquetas de estado en celdas (semánticas) ────────────────────────
    styles["OkLabel"] = ParagraphStyle(
        "OkLabel",
        parent=styles["Cell"],
        fontName="Helvetica-Bold",
        textColor=ZITY_OK,
    )
    styles["WarnLabel"] = ParagraphStyle(
        "WarnLabel",
        parent=styles["Cell"],
        fontName="Helvetica-Bold",
        textColor=ZITY_WARN,
    )
    styles["FailLabel"] = ParagraphStyle(
        "FailLabel",
        parent=styles["Cell"],
        fontName="Helvetica-Bold",
        textColor=ZITY_FAIL,
    )

    return styles


# ─── Helpers de tabla ─────────────────────────────────────────────────────────


def info_table(rows: Sequence[tuple[str, str]], styles: dict[str, ParagraphStyle]) -> Table:
    """
    Tabla de 2 columnas etiqueta/valor.
    Etiqueta: fondo tinte gris-azulado + texto azul oscuro (legible, no blanco).
    Valor: fondo blanco + texto cuerpo.
    """
    data = [
        [
            Paragraph(label, styles["CellLabel"]),
            Paragraph(value, styles["Cell"]),
        ]
        for label, value in rows
    ]
    t = Table(data, colWidths=[1.7 * inch, 5.05 * inch], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                # Columna etiqueta — fondo neutro claro, texto azul oscuro
                ("BACKGROUND", (0, 0), (0, -1), ZITY_LABEL_BG),
                # Columna valor — fondo blanco para máximo contraste
                ("BACKGROUND", (1, 0), (1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                # Más respiración entre líneas y columnas
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                # Línea fina entre filas; sin línea exterior, lo da el borde
                ("LINEBELOW", (0, 0), (-1, -2), 0.4, ZITY_BORDER_LIGHT),
                # Borde exterior fino
                ("BOX", (0, 0), (-1, -1), 0.5, ZITY_BORDER),
                # Separador vertical fino entre label y valor
                ("LINEAFTER", (0, 0), (0, -1), 0.4, ZITY_BORDER),
            ]
        )
    )
    return t


def grid_table(
    header: Sequence[str],
    rows: Sequence[Sequence[object]],
    col_widths: Sequence[float],
    styles: dict[str, ParagraphStyle],
) -> Table:
    """Tabla con cabecera azul oscuro + filas con zebra muy sutil."""
    header_row = [Paragraph(h, styles["CellHeader"]) for h in header]
    data: list[list[object]] = [header_row]
    for r in rows:
        data.append([_to_cell(c, styles) for c in r])

    t = Table(data, colWidths=list(col_widths), hAlign="LEFT", repeatRows=1)
    style_cmds: list[tuple] = [
        # Cabecera
        ("BACKGROUND", (0, 0), (-1, 0), ZITY_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        # Cuerpo
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
        # Líneas divisoras entre filas (sólo cuerpo)
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, ZITY_BORDER_LIGHT),
        # Borde exterior fino
        ("BOX", (0, 0), (-1, -1), 0.5, ZITY_BORDER),
    ]
    # Zebra muy sutil
    for i, _ in enumerate(rows, start=1):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), ZITY_BG_SOFT))
        else:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), colors.white))
    t.setStyle(TableStyle(style_cmds))
    return t


def _to_cell(cell, styles: dict[str, ParagraphStyle]):
    if isinstance(cell, Paragraph):
        return cell
    if isinstance(cell, str):
        return Paragraph(cell, styles["Cell"])
    return Paragraph(str(cell), styles["Cell"])


def quote_box(text: str, styles: dict[str, ParagraphStyle]) -> Table:
    """
    Bloque de cita destacada (Sprint Goal, mensajes clave). Usamos Table en vez
    de Paragraph con backColor/borderPadding para evitar el bug de ReportLab
    donde la caja se solapa con el elemento anterior cuando hay `spaceBefore`
    y `borderPadding` simultáneos.
    """
    p = Paragraph(text, styles["Quote"])
    t = Table([[p]], colWidths=[PAGE_W - LEFT_MARGIN - RIGHT_MARGIN], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ZITY_BG_QUOTE),
                ("BOX", (0, 0), (-1, -1), 0.5, ZITY_BLUE_LIGHT),
                ("LEFTPADDING", (0, 0), (-1, -1), 20),
                ("RIGHTPADDING", (0, 0), (-1, -1), 20),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                # Acento decorativo a la izquierda
                ("LINEBEFORE", (0, 0), (0, -1), 3, ZITY_BLUE),
            ]
        )
    )
    return t


def _separador_decorativo() -> Table:
    """Filete fino centrado, tipo línea editorial bajo el título."""
    t = Table(
        [[""]],
        colWidths=[1.2 * inch],
        rowHeights=[0.04 * inch],
        hAlign="CENTER",
    )
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ZITY_BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return t


def section_banner(label: str, styles: dict[str, ParagraphStyle]) -> Table:
    """
    Banda de sección a ancho completo. Más alto y con tipografía espaciada
    para evocar revistas académicas.
    """
    p = Paragraph(label, styles["SectionBanner"])
    t = Table([[p]], colWidths=[PAGE_W - LEFT_MARGIN - RIGHT_MARGIN], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ZITY_BLUE_DARK),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LINEBEFORE", (0, 0), (0, -1), 4, ZITY_BLUE),
            ]
        )
    )
    return t


def hu_card(
    code: str,
    title: str,
    estimacion: str,
    prioridad: str,
    historia: str,
    criterios: Sequence[str],
    evidencia: str | None,
    styles: dict[str, ParagraphStyle],
    star: bool = False,
) -> KeepTogether:
    """Card visual de una historia de usuario, estilo académico refinado."""
    header_left = f"<b>{code}</b> · {title}{'  ★' if star else ''}"
    header_table = Table(
        [
            [
                Paragraph(header_left, styles["CellBold"]),
                Paragraph(estimacion, styles["Cell"]),
                Paragraph(prioridad, styles["Cell"]),
            ]
        ],
        colWidths=[4.1 * inch, 1.25 * inch, 1.4 * inch],
        hAlign="LEFT",
    )
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), ZITY_LABEL_BG),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#dde7f0")),
                ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#f0dada")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("ALIGN", (1, 0), (-1, 0), "CENTER"),
                ("BOX", (0, 0), (-1, -1), 0.5, ZITY_BORDER),
            ]
        )
    )

    items: list = [
        header_table,
        Spacer(1, 8),
        Paragraph(historia, styles["Body"]),
        Spacer(1, 4),
        Paragraph("<b>Criterios de aceptación</b>", styles["H3"]),
    ]
    for c in criterios:
        items.append(Paragraph(f"☐ &nbsp; {c}", styles["BodyLeft"]))
    if evidencia:
        items.append(Spacer(1, 4))
        items.append(Paragraph(f"<b>Evidencia:</b> <i>{evidencia}</i>", styles["Note"]))
    if star:
        items.append(Paragraph(
            "★ <i>Continúa el feedback del profesor o emergente del Sprint anterior.</i>",
            styles["Note"],
        ))
    items.append(Spacer(1, 14))
    return KeepTogether(items)


# ─── Plantilla con cabecera/pie ───────────────────────────────────────────────


def make_doc(path: str) -> BaseDocTemplate:
    doc = BaseDocTemplate(
        path,
        pagesize=LETTER,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title="Zity · Artefactos Sprint 5",
        author="Equipo Zity",
        subject="Trazabilidad: historial completo y audit log visible",
        keywords="scrum, sprint 5, zity, trazabilidad, audit log",
    )

    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="main",
        showBoundary=0,
    )

    def on_page(canvas, doc_):
        canvas.saveState()

        # Línea fina decorativa en el footer
        canvas.setStrokeColor(ZITY_BORDER)
        canvas.setLineWidth(0.4)
        canvas.line(
            LEFT_MARGIN,
            0.6 * inch,
            PAGE_W - RIGHT_MARGIN,
            0.6 * inch,
        )

        # Marca de producto (izquierda)
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.setFillColor(ZITY_BLUE_DARK)
        canvas.drawString(LEFT_MARGIN, 0.4 * inch, "Zity")
        canvas.setFont("Helvetica", 8.5)
        canvas.setFillColor(ZITY_TEXT_MUTED)
        canvas.drawString(
            LEFT_MARGIN + 0.32 * inch,
            0.4 * inch,
            "· Artefactos Scrum · Sprint 5",
        )

        # Número de página (derecha)
        canvas.setFont("Helvetica", 8.5)
        canvas.setFillColor(ZITY_TEXT_MUTED)
        canvas.drawRightString(
            PAGE_W - RIGHT_MARGIN,
            0.4 * inch,
            f"pág. {doc_.page}",
        )

        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=on_page)])
    return doc


# ─── Contenido del Sprint 5 ───────────────────────────────────────────────────


def build_story(styles: dict[str, ParagraphStyle]) -> list:
    s: list = []

    # ── Portada ────────────────────────────────────────────────────────────
    s.append(Spacer(1, 20))
    s.append(Paragraph("Zity", styles["TitleCover"]))
    s.append(Spacer(1, 4))
    # Filete decorativo bajo el título
    s.append(_separador_decorativo())
    s.append(Spacer(1, 12))
    s.append(Paragraph("Artefactos Scrum — Sprint 5", styles["SubtitleCover"]))
    s.append(
        Paragraph(
            "Trazabilidad — Historial de estados con notas obligatorias · "
            "Audit log completo y vista admin · Perfil editable · Emergentes Sprint 4",
            styles["TaglineCover"],
        )
    )
    s.append(Spacer(1, 16))

    s.append(
        info_table(
            [
                ("Producto", "Zity"),
                ("Sprint", "Sprint 5 — Semana 7"),
                (
                    "Stack",
                    "React 19 + Vite 8 + TailwindCSS 4 · Supabase (Postgres + Auth + Storage + Realtime) · "
                    "Vercel · GitHub Actions · Vitest (Playwright planificado para Sprint 7)",
                ),
                ("Product Owner", "Alvarez Rocca Jaqueline"),
                ("Scrum Master", "Meza Pelaez Carlos"),
                (
                    "Developers",
                    "Cortez Zamora Leonardo Fabian · Gonza Morales Yoel Ronaldo · "
                    "Santiago Flores Carlos Steven",
                ),
                ("Capacidad semanal", "3 h/día × 5 integrantes = 15 horas/semana · 60 horas/mes"),
                ("Horas estimadas", "13 horas (2 horas de buffer)"),
                (
                    "DoD aplicable",
                    "DoD v2 — segunda aplicación (calidad + seguridad base + integración)",
                ),
                (
                    "Nuevo en este sprint",
                    "Vista admin del audit_log con filtros · Helper de auditoría centralizado · "
                    "Perfil de usuario editable · Continúa la deuda DoD v2 (/health planificado Sprint 8)",
                ),
                ("Nota", "Documento académico — Datos ficticios sin PII real"),
            ],
            styles,
        )
    )
    s.append(Spacer(1, 14))
    s.append(Paragraph("Documento vivo — se actualiza en cada Sprint Review", styles["Footer"]))
    s.append(PageBreak())

    # ── 1. SPRINT PLANNING ─────────────────────────────────────────────────
    s.append(section_banner("1   ACTA DE SPRINT PLANNING", styles))
    s.append(Spacer(1, 14))

    s.append(
        info_table(
            [
                ("Sprint", "Sprint 5 — Semana 7"),
                ("Fecha", "Lunes — inicio de semana 7"),
                ("Duración del evento", "75 minutos"),
                ("Facilitador", "Meza Pelaez Carlos (Scrum Master)"),
                (
                    "Asistentes",
                    "Alvarez Rocca Jaqueline (PO), Meza Pelaez Carlos (SM), "
                    "Cortez Zamora Leonardo, Gonza Morales Yoel, "
                    "Santiago Flores Carlos (Devs)",
                ),
                (
                    "Stakeholder invitado",
                    "Carlos Fuentes (Admin ficticio) — el caso de uso del Sprint es "
                    "principalmente del admin, así que se prioriza su participación",
                ),
                ("Capacidad", "15 horas disponibles · se usarán 13 h (2 h de buffer)"),
                (
                    "Entrada",
                    "Product Backlog actualizado tras Sprint 4 Review con 5 PBIs emergentes · "
                    "DoD v2 continúa (7/9 al cierre del Sprint 4, los 2 pendientes son CD/health) · "
                    "Acciones de mejora del Sprint 4 Retro entran en vigor",
                ),
                (
                    "Variables nuevas",
                    "Ninguna — el módulo de auditoría reutiliza la infra existente",
                ),
                (
                    "Estrategia de seed",
                    "Ejecutar los flujos de Sprint 4 contra el seed actual para poblar audit_log "
                    "y historial_estados con datos demostrables. Sin archivos nuevos.",
                ),
            ],
            styles,
        )
    )
    s.append(Spacer(1, 10))

    s.append(Paragraph("Sprint Goal", styles["H2"]))
    s.append(Spacer(1, 6))
    s.append(quote_box(
        '"Cerrar el ciclo de trazabilidad: toda acción crítica queda registrada en '
        "audit_log con contexto suficiente, el admin la consulta desde un panel con "
        "filtros operativos, y la lógica de auditoría se centraliza en un único "
        "helper. Atender los emergentes del Sprint 4 (carga de trabajo del técnico "
        'en asignación, foto al rechazar) y habilitar la edición del perfil propio."',
        styles,
    ))
    s.append(
        Paragraph(
            "Nota: Segunda aplicación de DoD v2. Las acciones de mejora del Sprint 4 Retro entran "
            "en vigor: (1) auditoría de cobertura como pre-requisito de cierre, (2) decisiones de "
            "privacidad/UX en el Planning, (3) coordinación de branches que tocan la misma tabla.",
            styles["Note"],
        )
    )
    s.append(Spacer(1, 10))

    # PBIs seleccionados
    s.append(Paragraph("PBIs seleccionados — Sprint 5", styles["H2"]))
    pbi_header = ["ID", "Historia / Tarea", "Tipo", "Prior.", "Horas", "Responsable"]
    pbi_rows = [
        [
            "PBI-13",
            "Historial de estados con notas obligatorias en transiciones críticas",
            "Historia",
            Paragraph("● P1", styles["FailLabel"]),
            "3 h",
            "Gonza Morales",
        ],
        [
            "PBI-14",
            "Audit log completo: insertar entrada en crear/asignar/cerrar/bloquear/confirmar/rechazar",
            "Historia",
            Paragraph("● P1", styles["FailLabel"]),
            "2 h",
            "Cortez Zamora",
        ],
        [
            "HU-AUDIT-01",
            "Vista admin del audit_log con filtros por usuario, acción y rango de fechas",
            "Historia",
            Paragraph("● P1", styles["FailLabel"]),
            "2.5 h",
            "Santiago Flores",
        ],
        [
            "Refactor",
            "Centralizar lógica de auditoría: helper logAuditAction() único, basado en el helper del Sprint 4",
            "Chore",
            Paragraph("● P2", styles["WarnLabel"]),
            "1.5 h",
            "Gonza Morales",
        ],
        [
            "PBI-S2-E03",
            "Perfil de usuario editable: nombre, apellido, teléfono (emergente Sprint 2)",
            "Historia",
            Paragraph("● P2", styles["WarnLabel"]),
            "1 h",
            "Cortez Zamora",
        ],
        [
            "PBI-S4-E02",
            "Mostrar carga de trabajo del técnico (solicitudes activas) en dropdown de asignación",
            "Historia",
            Paragraph("● P2", styles["WarnLabel"]),
            "1 h",
            "Santiago Flores",
        ],
        [
            "PBI-S4-E04",
            "Permitir adjuntar foto al rechazar la solución del técnico",
            "Historia",
            Paragraph("● P2", styles["WarnLabel"]),
            "1 h",
            "Cortez Zamora",
        ],
        [
            "Chore",
            "Documentar formato JSON de audit_log.detalles en /docs/audit.md",
            "Chore",
            Paragraph("● P2", styles["WarnLabel"]),
            "1 h",
            "Gonza Morales",
        ],
    ]
    s.append(
        grid_table(
            pbi_header,
            pbi_rows,
            [0.85 * inch, 2.65 * inch, 0.65 * inch, 0.55 * inch, 0.55 * inch, 1.05 * inch],
            styles,
        )
    )
    s.append(
        Paragraph(
            "Total estimado: 13 horas · 2 horas de buffer disponibles para imprevistos.",
            styles["Body"],
        )
    )
    s.append(Spacer(1, 8))

    # Decisiones técnicas
    s.append(Paragraph("Decisiones técnicas del Sprint", styles["H2"]))
    s.append(
        Paragraph(
            "Antes de iniciar el desarrollo, el equipo toma las siguientes decisiones técnicas:",
            styles["Body"],
        )
    )
    dec_header = ["Decisión", "Detalle", "Registrado en"]
    dec_rows = [
        [
            "Helper de auditoría",
            "Función logAuditAction(supabase, { accion, entidad, entidad_id, detalles, resultado }) "
            "en src/lib/audit.ts. Inserta con usuario_id=auth.uid() y resultado por defecto exitoso. "
            "Refactor obligatorio: ningún módulo nuevo escribe audit_log directamente.",
            "/docs/audit.md",
        ],
        [
            "Notas obligatorias",
            "En transiciones críticas (resuelta, cerrada, escalada, bloquear cuenta) el componente exige "
            "nota mínima 20 chars. Frontend + validación PG (CHECK length(nota)>=20 cuando estado_nuevo ∈ "
            "{resuelta, cerrada}).",
            "Criterio PBI-13 + migración SQL",
        ],
        [
            "Vista admin de auditoría",
            "Ruta /admin/auditoria con tabla paginada (50 filas/página) + filtros combinables: rango de "
            "fechas (date range picker), usuario (autocomplete sobre usuarios.email), acción (select del "
            "catálogo). Export CSV planificado para Sprint 9.",
            "Criterio HU-AUDIT-01",
        ],
        [
            "Privacidad en vista admin",
            "El audit_log persiste solo IDs (sin PII). En la vista se hace JOIN con usuarios para mostrar "
            "nombre+apellido, alineado con la política definida en Sprint 4 (docs/privacidad.md).",
            "/docs/privacidad.md",
        ],
        [
            "Coordinación de branches",
            "Cortez y Santiago tocan distintos archivos (perfil vs asignación) — sin conflicto. Gonza "
            "ejecuta el refactor al final como branch independiente sobre el merge previo.",
            "Acción 3 Retro Sprint 4",
        ],
        [
            "Cobertura mínima como gate",
            "Antes de cerrar el Sprint, src/lib/audit.ts debe alcanzar ≥ 60% (replicar lo logrado por "
            "solicitudes.ts en Sprint 4). vite.config.ts añade un threshold por archivo nuevo.",
            "Acción 1 Retro Sprint 4",
        ],
    ]
    s.append(
        grid_table(
            dec_header,
            dec_rows,
            [1.4 * inch, 4.2 * inch, 1.3 * inch],
            styles,
        )
    )
    s.append(Spacer(1, 10))

    # Desglose por dev
    s.append(Paragraph("Desglose de tareas — ¿Cómo?", styles["H2"]))

    s.append(Paragraph("Gonza Morales Yoel — PBI-13 + Refactor auditoría + docs (5.5 h)", styles["H3"]))
    tarea_header = ["Tarea", "Horas"]
    s.append(
        grid_table(
            tarea_header,
            [
                ["Migración SQL: CHECK constraints de longitud de nota en historial_estados para transiciones críticas (resuelta/cerrada).", "0.5 h"],
                ["Refactor del componente HistorialEstados: si la transición crítica no tiene nota válida, deshabilitar el botón Guardar y mostrar error inline.", "1 h"],
                ["src/lib/audit.ts: helper logAuditAction() con tipos estrictos para accion/entidad. Documentar el formato del campo detalles JSON.", "1 h"],
                ["Refactor de los 4 hooks que escribían audit_log (asignar, actualizar, confirmar, rechazar) para usar el nuevo helper. Eliminar duplicación.", "1 h"],
                ["Tests del helper de auditoría con cobertura ≥ 60% (validación de payload, manejo de error, fire-and-forget en CI).", "1 h"],
                ["/docs/audit.md: documentar catálogo cerrado de acciones, formato del JSON de detalles y política de no-PII.", "1 h"],
            ],
            [5.5 * inch, 1.0 * inch],
            styles,
        )
    )

    s.append(Paragraph("Santiago Flores Carlos — PBI-14 + HU-AUDIT-01 + PBI-S4-E02 (5.5 h)", styles["H3"]))
    s.append(
        grid_table(
            tarea_header,
            [
                ["Completar la inserción en audit_log para acciones que aún no la disparaban (bloquear/desbloquear vía Edge Function ya escribía; verificar parity).", "0.5 h"],
                ["Componente /admin/auditoria: layout tipo tabla, paginación servidor con range() y orden por created_at desc. Skeleton de carga.", "1.5 h"],
                ["Filtros combinables: date range picker (sin librerías externas, dos inputs date), select de acción contra catálogo, autocomplete de usuario con debounce 300ms.", "2 h"],
                ["PBI-S4-E02: extender el dropdown del modal de asignación para mostrar el conteo de solicitudes activas por técnico (subquery con count). Indicador visual si > 5.", "1 h"],
                ["Tests de integración (Vitest) verificando que cambios de filtro producen requests con los params correctos.", "0.5 h"],
            ],
            [5.5 * inch, 1.0 * inch],
            styles,
        )
    )

    s.append(Paragraph("Cortez Zamora Leonardo — PBI-S2-E03 + PBI-S4-E04 (2 h)", styles["H3"]))
    s.append(
        grid_table(
            tarea_header,
            [
                ["Página /residente/perfil (y equivalente en técnico/admin): editar nombre, apellido, teléfono. Email y rol siguen siendo de solo lectura.", "1 h"],
                ["Extender ModalRechazarSolucion para aceptar foto opcional (mismo flujo de UploadFoto con capture='environment'). La foto se guarda en bucket existente bajo carpeta 'rechazo/'.", "1 h"],
            ],
            [5.5 * inch, 1.0 * inch],
            styles,
        )
    )
    s.append(Spacer(1, 10))

    # Riesgos
    s.append(Paragraph("Riesgos del Sprint 5", styles["H2"]))
    risk_header = ["#", "Riesgo", "Prob.", "Impacto", "Mitigación"]
    risk_rows = [
        [
            "R1",
            "El refactor del helper de auditoría rompe los inserts existentes del Sprint 4 (asignar, confirmar, rechazar).",
            Paragraph("● Media", styles["WarnLabel"]),
            Paragraph("● Alto", styles["FailLabel"]),
            "Refactor con tests verdes en cada paso. Los 8 tests de cambiarEstadoSolicitud del Sprint 4 son la red de seguridad: deben seguir pasando tras cada cambio.",
        ],
        [
            "R2",
            "El audit_log podría crecer rápido con datos reales y la vista admin sin paginación correcta sería lenta.",
            Paragraph("● Media", styles["WarnLabel"]),
            Paragraph("● Medio", styles["WarnLabel"]),
            "Paginación servidor con range() desde el Día 1. Índice (created_at desc) ya existe; verificar con EXPLAIN ANALYZE en seed con 100+ filas.",
        ],
        [
            "R3",
            "El date range picker sin librería externa puede consumir más tiempo del planificado.",
            Paragraph("● Baja", styles["OkLabel"]),
            Paragraph("● Medio", styles["WarnLabel"]),
            "Si excede 1h, hacer fallback a dos <input type=date>. Documentar la decisión en el PR.",
        ],
        [
            "R4",
            "Las notas obligatorias podrían bloquear flujos legítimos donde el técnico no quiere extenderse al cierre.",
            Paragraph("● Baja", styles["OkLabel"]),
            Paragraph("● Bajo", styles["OkLabel"]),
            "El mínimo de 20 chars ya fue aceptado en Sprint 4 sin fricción. Mantenerlo y validar UX en review.",
        ],
        [
            "R5",
            "La cobertura de src/lib/audit.ts podría no alcanzar el 60% si el helper queda subusado.",
            Paragraph("● Media", styles["WarnLabel"]),
            Paragraph("● Medio", styles["WarnLabel"]),
            "Plan: 6 tests unitarios mínimos cubriendo accion/entidad/detalles válidos e inválidos, fallo de RLS, fire-and-forget. Si no llega, bajar threshold a 50% (Acción 1 Retro Sprint 4 aplica).",
        ],
    ]
    s.append(
        grid_table(
            risk_header,
            risk_rows,
            [0.4 * inch, 2.2 * inch, 0.7 * inch, 0.7 * inch, 2.9 * inch],
            styles,
        )
    )
    s.append(Spacer(1, 10))
    s.append(PageBreak())

    # ── 2. DAILY SCRUMS ────────────────────────────────────────────────────
    s.append(section_banner("2   REGISTRO DE DAILY SCRUMS", styles))
    s.append(Spacer(1, 14))
    s.append(
        Paragraph(
            "Referencia Scrum: la Daily Scrum inspecciona el progreso hacia el Sprint Goal y "
            "adapta el Sprint Backlog. Duración máxima: 15 minutos.",
            styles["Note"],
        )
    )
    s.append(Spacer(1, 6))
    s.append(quote_box(
        'Sprint Goal: "Cerrar la trazabilidad: audit_log completo · vista admin con filtros · '
            'helper centralizado · perfil editable."',
        styles,
    ))

    s.append(Paragraph("Daily Scrum — Día 1 (Lunes)", styles["H2"]))
    s.append(
        info_table(
            [
                ("DÍA", "Lunes — Día 1"),
                (
                    "Progreso hacia el objetivo",
                    "Acciones del Sprint 4 Retro verificadas en el Planning: (1) cobertura inicial "
                    "auditada — src/lib/solicitudes.ts está al 100%/95%/100%/100% (Sprint 4 cerrado bien); "
                    "(2) decisiones de privacidad explicitadas — vista admin muestra nombre+apellido por "
                    "JOIN, audit_log solo IDs; (3) coordinación de branches acordada — Santiago/Cortez "
                    "tocan archivos independientes, Gonza refactoriza al final.",
                ),
                (
                    "Plan siguiente 24h",
                    "Gonza Morales: migración SQL del CHECK + refactor de HistorialEstados con nota "
                    "obligatoria. Santiago Flores: scaffolding de /admin/auditoria con paginación. "
                    "Cortez Zamora: página de perfil editable.",
                ),
                (
                    "Impedimentos",
                    "Ninguno — todas las acciones del Retro Sprint 4 quedaron listas el Día 1.",
                ),
                (
                    "Ajuste Sprint Backlog",
                    "Sin cambios.",
                ),
            ],
            styles,
        )
    )

    s.append(Paragraph("Daily Scrum — Día 2 (Martes)", styles["H2"]))
    s.append(
        info_table(
            [
                ("DÍA", "Martes — Día 2"),
                (
                    "Progreso hacia el objetivo",
                    "Migración del CHECK aplicada y HistorialEstados ya bloquea el guardado si la nota "
                    "es < 20 chars en transiciones críticas. Vista /admin/auditoria con paginación y "
                    "filtro por acción funcionando contra audit_log real (25 entradas del seed). El "
                    "helper logAuditAction() está esqueleteado pero sin refactor de los hooks. Página "
                    "de perfil editable completa para residente (los otros 2 roles comparten el "
                    "componente).",
                ),
                (
                    "Plan siguiente 24h",
                    "Santiago Flores: date range picker nativo (2 inputs date) + autocomplete de "
                    "usuario por email + PBI-S4-E02 dropdown con conteo. Gonza Morales: refactor de "
                    "los 4 hooks para usar logAuditAction() + tests del helper. Cortez Zamora: foto "
                    "opcional en ModalRechazarSolucion.",
                ),
                (
                    "Impedimentos",
                    "El autocomplete del filtro por usuario hace 1 request por keystroke; sin debounce "
                    "se nota lag con 9 usuarios en BD. Se acuerda debounce de 300ms.",
                ),
                (
                    "Ajuste Sprint Backlog",
                    "Se agrega 'tarea técnica' implícita en HU-AUDIT-01: hook debounced para filtros "
                    "(15 min, Santiago Flores).",
                ),
            ],
            styles,
        )
    )

    s.append(Paragraph("Daily Scrum — Día 3 (Miércoles)", styles["H2"]))
    s.append(
        info_table(
            [
                ("DÍA", "Miércoles — Día 3"),
                (
                    "Progreso hacia el objetivo",
                    "Flujo end-to-end demostrable: cualquier acción crítica genera entry en audit_log "
                    "vía helper centralizado, y el admin la ve en /admin/auditoria filtrando por "
                    "fecha+usuario+acción. Refactor del Sprint 4 sin regresiones — los 8 tests de "
                    "cambiarEstadoSolicitud siguen verdes. PBI-S4-E02 funcionando: el dropdown "
                    "muestra '(3 activas)' al lado de cada técnico, con badge naranja si > 5. "
                    "PBI-S4-E04 listo: residente puede adjuntar foto al rechazar. CI verde con "
                    "cobertura 71% en src/lib/audit.ts (objetivo ≥ 60%).",
                ),
                (
                    "Plan siguiente 24h",
                    "Santiago Flores: preparar guión de Sprint Review enfocado en demostrar trazabilidad "
                    "como propiedad del sistema (no solo como tabla). Gonza Morales: completar "
                    "/docs/audit.md y verificar DoD v2. Cortez Zamora: pulir UX de perfil editable "
                    "(toast de confirmación, manejo de errores).",
                ),
                (
                    "Impedimentos",
                    "El admin pidió en la demo previa poder filtrar también por 'entidad' (solicitudes "
                    "vs usuarios vs invitaciones). El filtro existe en BD pero no en UI.",
                ),
                (
                    "Ajuste Sprint Backlog",
                    "Hotfix de 30 min (Santiago Flores): agregar select de entidad al filtro. Entra al "
                    "PR antes de cerrar.",
                ),
            ],
            styles,
        )
    )
    s.append(PageBreak())

    # ── 3. SPRINT REVIEW ───────────────────────────────────────────────────
    s.append(section_banner("3   ACTA DE SPRINT REVIEW", styles))
    s.append(Spacer(1, 14))
    s.append(
        Paragraph(
            "Referencia Scrum: la Sprint Review inspecciona el resultado del Sprint y determina "
            "adaptaciones futuras. Es una sesión de trabajo, no una presentación.",
            styles["Note"],
        )
    )
    s.append(
        info_table(
            [
                ("Sprint", "Sprint 5 — Semana 7"),
                ("Fecha", "Viernes — cierre de semana 7"),
                ("Duración", "50 minutos"),
                ("Facilitador", "Alvarez Rocca Jaqueline (PO)"),
                (
                    "Scrum Team",
                    "Alvarez Rocca Jaqueline (PO), Meza Pelaez Carlos (SM), Cortez Zamora Leonardo, "
                    "Gonza Morales Yoel, Santiago Flores Carlos",
                ),
                (
                    "Stakeholders",
                    "Carlos Fuentes (Admin ficticio), Laura Vega (Residente ficticia), "
                    "Profesor del curso",
                ),
                (
                    "Incremento presentado",
                    "Vista /admin/auditoria con filtros (fecha, usuario, acción, entidad). Helper "
                    "centralizado logAuditAction() en uso en todos los hooks del módulo de "
                    "solicitudes. Notas obligatorias en transiciones críticas. Perfil editable. "
                    "Dropdown de asignación con carga de trabajo. Foto opcional al rechazar.",
                ),
            ],
            styles,
        )
    )

    s.append(Paragraph("Guión de demostración", styles["H2"]))
    demo = [
        "Carlos Fuentes (admin) entra a /admin/auditoria. La vista muestra 47 entradas paginadas "
        "(últimas 7 días por defecto). Cada fila trae: timestamp, usuario, acción, entidad, ID de "
        "entidad, badge de resultado.",
        "Filtra por usuario = Mario Peña (autocomplete por email). La tabla queda con 12 entradas: "
        "11 'actualizar_estado_solicitud' + 1 'asignar_solicitud' (cuando Mario fue asignado).",
        "Cambia filtro a acción = 'rechazar_solucion'. Aparece la entrada del Sprint 4 Review donde "
        "Laura rechazó ZIT-003, con detalles.intentos=1.",
        "Carlos abre la entrada y ve el JSON crudo del campo detalles (formato documentado en "
        "/docs/audit.md). Se discute con el profesor cómo escalar para que cada acción tenga su "
        "vista de detalle propia (futuro Sprint).",
        "Laura Vega (residente, otro celular) edita su perfil: cambia su teléfono. La actualización "
        "no aparece en audit_log porque no es acción crítica — sí queda con updated_at actualizado.",
        "Demostración del PBI-S4-E02: Carlos abre el modal de asignar técnico para una solicitud "
        "nueva. El dropdown muestra 'Mario Peña · TecnoEdif SAC · (3 activas)' y 'Juan Cruz · "
        "Internos · (7 activas) ⚠'. Carlos elige al menos cargado.",
        "Demostración del PBI-S4-E04: Laura rechaza una solución y adjunta foto del problema "
        "persistente. La foto queda asociada al rechazo en bucket existente.",
        "Trazabilidad cierra el círculo: el admin ahora tiene visibilidad total sobre quién hizo "
        "qué y cuándo, y el residente sobre cada cambio en sus solicitudes.",
    ]
    for i, step in enumerate(demo, start=1):
        s.append(Paragraph(f"<b>{i}.</b> {step}", styles["BodyLeft"]))
    s.append(Spacer(1, 8))

    s.append(Paragraph("Revisión del Sprint Goal", styles["H2"]))
    s.append(Spacer(1, 6))
    s.append(quote_box(
        "✓ <b>CUMPLIDO:</b> audit_log poblado · vista admin con filtros · helper centralizado · "
            "notas obligatorias · perfil editable · carga del técnico · foto al rechazar. "
            "DoD v2 al <b>78%</b> (mismo nivel que Sprint 4: los 2 criterios pendientes — /health y "
            "verificación post-deploy — están planificados para Sprint 8 como CD).",
        styles,
    ))
    s.append(Spacer(1, 6))

    s.append(Paragraph("Feedback de stakeholders", styles["H2"]))

    s.append(Paragraph("Profesor del curso", styles["H3"]))
    for bullet in [
        '"La vista de auditoría es realmente útil. Filtrar por fecha+usuario+acción es lo que '
        'esperaría ver en un sistema de producción." → Validación.',
        '"Idea para más adelante: ¿podría el admin ver no solo qué pasó sino una línea de tiempo '
        'visual de la solicitud, con todos los cambios y notas en orden?" → Excelente. PO lo '
        'convierte en HU-MANT-08: \'Timeline visual completo de una solicitud\' (incluye '
        'asignación, cambios de estado, confirmación/rechazo, edición de prioridad). P2, 3h. '
        'Sprint 10.',
        '"El dropdown con carga del técnico está bien, pero ¿podría haber una vista agregada por '
        'admin que muestre la carga total del equipo de mantenimiento?" → PBI-S5-E01: '
        '\'Dashboard admin con resumen de carga por técnico y por empresa\'. P3, 2h. Sprint 10.',
    ]:
        s.append(Paragraph(f"• {bullet}", styles["Body"]))

    s.append(Paragraph("Carlos Fuentes (Administrador)", styles["H3"]))
    for bullet in [
        '"Me encanta poder buscar por usuario. Pero a veces quiero ver todas las acciones que '
        'afectaron una solicitud específica — ahora tengo que filtrar por entidad_id manualmente." '
        '→ PBI-S5-E02: \'Botón \\"Ver auditoría\\" en el drawer de una solicitud que filtra el '
        'audit_log por ese ID\'. P2, 1h. Sprint 6.',
        '"Cuando hay muchas entradas, exportar a CSV sería útil para reportes mensuales." → '
        'Ya está planificado para Sprint 9 (HU-AUDIT-02: exportación CSV del audit_log con los '
        'mismos filtros activos).',
    ]:
        s.append(Paragraph(f"• {bullet}", styles["Body"]))

    s.append(Paragraph("Laura Vega (Residente)", styles["H3"]))
    for bullet in [
        '"La foto al rechazar la solución es lo que faltaba. Antes solo podía explicar con palabras." '
        '→ Validación.',
        '"Poder editar mi teléfono está bien, pero me gustaría poder cambiar la contraseña desde '
        'el perfil sin pasar por el flujo de recuperación." → PBI-S5-E03: \'Cambio de contraseña '
        'desde el perfil con contraseña actual\'. P2, 2h. Sprint 6.',
    ]:
        s.append(Paragraph(f"• {bullet}", styles["Body"]))

    s.append(Spacer(1, 6))

    # Decisiones backlog
    s.append(Paragraph("Decisiones de adaptación del Product Backlog", styles["H2"]))
    dec_review_header = ["Decisión", "Detalle"]
    dec_review_rows = [
        ["Hotfix en sprint", "Filtro adicional por entidad en /admin/auditoria (30 min, Santiago Flores)."],
        ["HU-MANT-08 (NUEVA)", "Timeline visual completo de una solicitud — P2, 3h, Sprint 10."],
        ["PBI-S5-E01", "Dashboard admin con carga total por técnico y empresa — P3, 2h, Sprint 10."],
        ["PBI-S5-E02", "Botón 'Ver auditoría' en drawer de solicitud — P2, 1h, Sprint 6."],
        ["PBI-S5-E03", "Cambio de contraseña desde el perfil — P2, 2h, Sprint 6."],
        ["Sprint 6 confirmado", "Notificaciones Realtime + email simulado + foto cierre técnico + emergentes Sprint 4/5 (S4-E01, S5-E02, S5-E03)."],
    ]
    s.append(
        grid_table(
            dec_review_header,
            dec_review_rows,
            [1.6 * inch, 5.0 * inch],
            styles,
        )
    )
    s.append(PageBreak())

    # ── 4. RETROSPECTIVE ───────────────────────────────────────────────────
    s.append(section_banner("4   ACTA DE SPRINT RETROSPECTIVE", styles))
    s.append(Spacer(1, 14))
    s.append(
        Paragraph(
            "Referencia Scrum: la Retrospective planifica formas de aumentar calidad y "
            "efectividad. Los cambios más impactantes pueden entrar al Sprint Backlog del próximo Sprint.",
            styles["Note"],
        )
    )
    s.append(
        info_table(
            [
                ("Sprint", "Sprint 5 — Semana 7"),
                ("Fecha", "Viernes — después de la Sprint Review"),
                ("Duración", "30 minutos"),
                ("Facilitador", "Meza Pelaez Carlos (Scrum Master)"),
                ("Participantes", "Todo el Scrum Team (PO + SM + Developers)"),
            ],
            styles,
        )
    )

    s.append(Paragraph("✓ ¿Qué salió bien?", styles["H2"]))
    for line in [
        "Las acciones de mejora del Sprint 4 Retro funcionaron las tres: (1) cobertura auditada el Día 1; "
        "(2) decisiones de privacidad ya en el Planning, sin consultas en Daily; (3) sin conflictos de merge.",
        "El helper centralizado logAuditAction() simplificó los 4 hooks existentes — código eliminado supera al añadido.",
        "Refactor sin regresiones: los 8 tests de cambiarEstadoSolicitud del Sprint 4 siguen verdes tras todos los cambios.",
        "DoD v2 cumplida sin sorpresas: 71% de cobertura en src/lib/audit.ts (objetivo ≥ 60%), checklist OWASP A01/A03/A07 verificada para los nuevos endpoints.",
        "El profesor reconoció que la trazabilidad es ya 'de producción' — una validación importante porque era el riesgo más explícito del PRD.",
    ]:
        s.append(Paragraph(f"• {line}", styles["Body"]))

    s.append(Paragraph("✗ ¿Qué salió mal?", styles["H2"]))
    for line in [
        "El date range picker nativo se ve diferente entre Chrome, Firefox y Safari. UX inconsistente. Lo dejamos pasar pero queda como deuda.",
        "El filtro por entidad fue pedido sólo en la demo, no estaba en los criterios. Hotfix improvisado de 30 min. Mejorar la fase de Refinement.",
        "El catálogo de acciones de auditoría está hardcodeado en TS y en SQL CHECK. Si cambia algo hay que mantener 2 sitios. Falta una fuente de verdad.",
    ]:
        s.append(Paragraph(f"• {line}", styles["Body"]))

    s.append(Paragraph("Acciones de mejora (máx. 3)", styles["H2"]))
    actions = [
        (
            "Acción 1 — Catálogo de acciones de auditoría unificado",
            "Crear una tabla `audit_acciones` con (codigo, descripcion, requiere_detalle) que el "
            "frontend lea por RPC al iniciar. El CHECK de SQL se reemplaza por FK a esta tabla. "
            "Una sola fuente de verdad.",
            "Gonza Morales Yoel",
            "Tabla audit_acciones poblada y consumida desde la vista admin de auditoría",
            "Desde Sprint 6",
        ),
        (
            "Acción 2 — Date range picker reusable",
            "Crear un componente <RangoDeFechas /> que envuelva los dos <input type=date> con "
            "estilos consistentes y validación (desde ≤ hasta, máx 90 días). Reutilizable en "
            "auditoría, exportación CSV (Sprint 9) y métricas (Sprint 9).",
            "Santiago Flores Carlos",
            "Componente usado en al menos 2 vistas distintas para el Sprint 9",
            "Desde Sprint 6",
        ),
        (
            "Acción 3 — Refinement formal entre Sprints",
            "Reservar 30 minutos entre la Retrospective y el Planning siguiente para que el PO "
            "presente los criterios completos de los PBIs del próximo Sprint. Reduce los hotfixes "
            "improvisados durante la Review.",
            "Alvarez Rocca Jaqueline (PO) + Meza Pelaez Carlos (SM)",
            "Reuniones de Refinement documentadas en el repositorio (notas markdown)",
            "Desde Sprint 6",
        ),
    ]
    for title, desc, owner, evidence, when in actions:
        s.append(Paragraph(title, styles["H3"]))
        s.append(
            info_table(
                [
                    ("Descripción", desc),
                    ("Dueño", owner),
                    ("Evidencia", evidence),
                    ("Fecha", when),
                ],
                styles,
            )
        )
        s.append(Spacer(1, 4))

    s.append(Paragraph("Verificación DoD v2", styles["H2"]))
    dod_header = ["Criterio", "Estado"]
    dod_rows = [
        ["Todo lo de DoD v1 (lint, unit tests, README, manejo errores, seed, deploy preview)", Paragraph("✓ CUMPLIDO", styles["OkLabel"])],
        ["Pruebas de integración para flujos críticos (auditoría: insertar, filtrar, paginar)", Paragraph("✓ CUMPLIDO — 6 tests integración nuevos", styles["OkLabel"])],
        ["Cobertura ≥ 60% en módulo src/lib/audit.ts", Paragraph("✓ CUMPLIDO — 71% al cierre", styles["OkLabel"])],
        ["Endpoint /health disponible en staging", Paragraph("■ Pendiente — planificado Sprint 8 (CD)", styles["WarnLabel"])],
        ["Checklist OWASP aplicada a cambios relevantes", Paragraph("✓ CUMPLIDO — A01 (vista admin con RLS), A03 (queries parametrizadas), A07 (auth en filtros) en /docs/security/checklist.md", styles["OkLabel"])],
        ["Variables de entorno via Secrets CI/CD — sin hardcode", Paragraph("✓ CUMPLIDO — sin variables nuevas en este Sprint", styles["OkLabel"])],
        ["Despliegue staging con verificación post-deploy", Paragraph("■ Pendiente — planificado Sprint 8 (CD)", styles["WarnLabel"])],
        ["tsc --noEmit pasa sin errores en CI", Paragraph("✓ CUMPLIDO", styles["OkLabel"])],
        ["Documento /docs/audit.md con formato del JSON de detalles", Paragraph("✓ CUMPLIDO — adicional a DoD v2", styles["OkLabel"])],
    ]
    s.append(grid_table(dod_header, dod_rows, [4.6 * inch, 2.0 * inch], styles))
    s.append(Spacer(1, 6))
    s.append(quote_box(
        "<b>DoD v2 CUMPLIDA AL 78%</b> (7/9 criterios — mismo nivel que Sprint 4). Los 2 criterios "
            "pendientes (/health + verificación post-deploy) se cierran en Sprint 8 (CD). Sprint 5 "
            "cerrado correctamente.",
        styles,
    ))
    s.append(PageBreak())

    # ── 5. HISTORIAS DE USUARIO ────────────────────────────────────────────
    s.append(section_banner("5   HISTORIAS DE USUARIO — SPRINT 5", styles))
    s.append(Spacer(1, 14))
    s.append(Paragraph("Módulo TRAZABILIDAD — Sprint 5", styles["H2"]))

    s.append(
        hu_card(
            "PBI-13 · Historial de estados con notas obligatorias",
            "Notas mínimas y validación en transiciones críticas",
            "Sprint 5 · 3 h",
            "P1 · 3 h",
            "Como <b>sistema</b>, quiero <b>exigir nota mínima en las transiciones críticas (resuelta y cerrada) "
            "de una solicitud</b>, para que el historial conserve un mínimo de contexto operacional y auditable.",
            [
                "Migración SQL: CHECK constraint sobre historial_estados que exija length(nota) ≥ 20 cuando estado_nuevo ∈ {resuelta, cerrada}.",
                "Componente HistorialEstados: el botón Guardar queda deshabilitado mientras la nota no cumpla el mínimo (con contador de caracteres).",
                "Error claro al intentar guardar con nota corta: 'La nota debe tener al menos 20 caracteres en cierres y resoluciones.'",
                "El criterio aplica también a las transiciones del residente (rechazar/confirmar) — ya cubierto en Sprint 4, se valida que la regla sea coherente.",
                "Tests de integración: insertar entradas con nota corta debe fallar con SQLSTATE 23514 (check_violation).",
            ],
            "Migración aplicada en Supabase; HistorialEstados muestra contador y bloqueo en transiciones críticas; CI verde.",
            styles,
        )
    )

    s.append(
        hu_card(
            "PBI-14 · Audit log completo en todas las acciones críticas",
            "Inserción uniforme en audit_log",
            "Sprint 5 · 2 h",
            "P1 · 2 h",
            "Como <b>sistema</b>, quiero que <b>toda acción crítica</b> (crear/asignar/cerrar solicitud, "
            "confirmar/rechazar/escalar, activar/bloquear cuenta, crear/aceptar invitación) genere una "
            "entrada en audit_log con contexto suficiente, para que el admin disponga de un registro "
            "completo y la auditoría sea reproducible.",
            [
                "Catálogo cerrado de acciones documentado en /docs/audit.md y validado por TypeScript (union type).",
                "Toda inserción usa el helper logAuditAction() — code review obligatorio rechaza inserts directos.",
                "El campo detalles JSON debe contener al menos: el estado anterior si aplica, el estado nuevo, los IDs de entidades relacionadas (tecnico_id, residente_id, etc.).",
                "Si la inserción del audit_log falla, NO se revierte la acción principal (fire-and-forget) — solo se loguea el error en consola del navegador.",
                "Test de cobertura: para cada acción del catálogo existe al menos un test que verifica que el helper se invocó con los args correctos.",
            ],
            "21 acciones distintas en audit_log al cierre del Sprint (vs 6 antes del Sprint 5); helper usado en 100% de las mutaciones de los hooks de solicitudes.",
            styles,
        )
    )

    s.append(
        hu_card(
            "HU-AUDIT-01 · Vista admin del audit_log con filtros",
            "Tabla paginada con filtros combinables",
            "Sprint 5 · 2.5 h",
            "P1 · 2.5 h",
            "Como <b>administrador</b>, quiero <b>una vista con la lista de todas las acciones críticas del "
            "sistema y filtros operativos</b>, para investigar incidentes, validar trazabilidad y rendir "
            "cuentas ante el dueño del edificio.",
            [
                "Ruta /admin/auditoria accesible solo para usuarios con rol=admin y estado_cuenta=activo (RLS + ProtectedRoute).",
                "Tabla paginada (50 filas/página) con orden created_at desc.",
                "Filtros combinables: rango de fechas (desde-hasta, máx 90 días), usuario (autocomplete por email, debounce 300ms), acción (select del catálogo), entidad (select cerrado).",
                "Cada fila: timestamp relativo (con tooltip absoluto), usuario (nombre+apellido), acción, entidad, ID de entidad, badge de resultado (exitoso/fallido), botón 'Ver detalles' que abre modal con el JSON crudo.",
                "Si los filtros no retornan nada, estado vacío amigable con ilustración + texto 'No hay actividad con estos criterios'.",
                "El URL conserva los filtros (query params) para poder compartir un link de búsqueda.",
                "Responsiva: en móvil colapsa los filtros en un drawer.",
            ],
            "Demostrado en Sprint 5 Review filtrando por usuario=Mario Peña y acción=rechazar_solucion sobre el audit_log poblado por Sprint 4.",
            styles,
        )
    )

    s.append(
        hu_card(
            "PBI-S2-E03 · Perfil de usuario editable",
            "Página de perfil con edición de datos personales",
            "Sprint 5 · 1 h",
            "P2 · 1 h",
            "Como <b>cualquier usuario activo</b>, quiero <b>editar mi nombre, apellido y teléfono</b> "
            "desde una página de perfil propia, para mantener mi información al día sin depender del admin.",
            [
                "Ruta /perfil accesible para todos los roles activos.",
                "Campos editables: nombre, apellido, teléfono. Solo lectura: email, rol, estado_cuenta, empresa_tercero, piso, departamento.",
                "Validación: nombre y apellido no vacíos (mín. 2 chars), teléfono con formato libre pero máx 20 chars.",
                "Botón Guardar deshabilitado si no hay cambios. Toast de confirmación al guardar.",
                "Si el UPDATE falla, mensaje claro y los valores anteriores se preservan en el formulario.",
                "RLS asegura que un usuario solo puede UPDATE su propio perfil (usuarios.id = auth.uid()).",
                "Edición del perfil NO genera entrada en audit_log (no es acción crítica por definición).",
            ],
            "Laura Vega edita su teléfono en /perfil; verificado que residente A no puede UPDATE perfil de residente B (RLS).",
            styles,
        )
    )

    s.append(
        hu_card(
            "PBI-S4-E02 · Carga de trabajo del técnico en dropdown de asignación ★",
            "Conteo de solicitudes activas por técnico",
            "Sprint 5 · 1 h",
            "P2 · 1 h",
            "Como <b>administrador</b>, quiero <b>ver cuántas solicitudes activas tiene cada técnico</b> "
            "en el dropdown del modal de asignación, para no sobrecargar a un técnico ya ocupado.",
            [
                "El dropdown del ModalAsignarTecnico añade junto al nombre la cantidad de solicitudes activas (estado en {asignada, en_progreso}).",
                "Formato visual: 'Mario Peña · TecnoEdif SAC · (3 activas)'. Si > 5 muestra badge naranja con icono de alerta.",
                "El conteo viene de una subquery agregada al fetch de técnicos (no se hacen requests adicionales por técnico).",
                "El conteo se refresca cada vez que se abre el modal (no se cachea entre aperturas).",
                "Si el técnico no tiene solicitudes activas, muestra '(libre)' en verde discreto.",
            ],
            "Carlos abre el modal y ordena la asignación priorizando técnicos con baja carga.",
            styles,
            star=True,
        )
    )

    s.append(
        hu_card(
            "PBI-S4-E04 · Foto opcional al rechazar solución ★",
            "Adjuntar foto del problema persistente al rechazar",
            "Sprint 5 · 1 h",
            "P2 · 1 h",
            "Como <b>residente</b>, quiero <b>poder adjuntar una foto al rechazar la solución del técnico</b>, "
            "para evidenciar visualmente que el problema persiste y dar contexto al próximo intento.",
            [
                "ModalRechazarSolucion incluye, debajo de la nota, un UploadFoto opcional con la misma UX del flujo original (capture='environment', máx 5MB, JPEG/PNG).",
                "Si el residente adjunta foto, se sube a bucket solicitudes-fotos bajo path {residente_id}/{solicitud_id}/rechazo_{timestamp}_{nombre}.",
                "El path queda guardado en historial_estados.nota como sufijo `[foto: <path>]` que la vista de detalle interpreta como link.",
                "Si no adjunta foto, el flujo sigue exactamente como antes (Sprint 4).",
                "Validación de la foto reutiliza validarImagen() existente.",
            ],
            "Laura adjunta foto del grifo aún goteando al rechazar la solución de Mario; el técnico la ve al refrescar su panel.",
            styles,
            star=True,
        )
    )
    s.append(Spacer(1, 6))

    # PBIs emergentes
    s.append(Paragraph("PBIs emergentes — entran en Sprints futuros", styles["H2"]))
    em_header = ["ID", "Historia", "Prior.", "Horas est.", "Sprint"]
    em_rows = [
        ["HU-MANT-08", "Timeline visual completo de una solicitud (cambios + notas en orden)", Paragraph("● P2", styles["WarnLabel"]), "3 h", "10"],
        ["PBI-S5-E01", "Dashboard admin con resumen de carga por técnico y por empresa", Paragraph("● P3", styles["OkLabel"]), "2 h", "10"],
        ["PBI-S5-E02", "Botón 'Ver auditoría' en el drawer de una solicitud (filtra audit_log por entidad_id)", Paragraph("● P2", styles["WarnLabel"]), "1 h", "6"],
        ["PBI-S5-E03", "Cambio de contraseña desde el perfil con la contraseña actual", Paragraph("● P2", styles["WarnLabel"]), "2 h", "6"],
    ]
    s.append(grid_table(em_header, em_rows, [1.1 * inch, 3.0 * inch, 0.7 * inch, 0.8 * inch, 0.7 * inch], styles))
    s.append(PageBreak())

    # ── 6. ESTADO DEL BACKLOG ──────────────────────────────────────────────
    s.append(section_banner("6   ESTADO DEL BACKLOG TRAS SPRINT 5", styles))
    s.append(Spacer(1, 14))
    s.append(Paragraph("Progreso acumulado", styles["H2"]))

    progress_header = ["Sprint", "Horas invertidas", "Incremento entregado", "Estado"]
    progress_rows = [
        ["Sprint 0", "12 h", "Setup técnico + CI/CD + ADRs base + Supabase configurado", Paragraph("✓ Completado", styles["OkLabel"])],
        ["Sprint 1", "15 h", "Módulo Auth: registro 2 pasos, activación, login por rol, recuperación", Paragraph("✓ Completado", styles["OkLabel"])],
        ["Sprint 2", "14 h", "BD modelada · Panel admin · Gestión de usuarios · Bloqueo/desbloqueo", Paragraph("✓ Completado", styles["OkLabel"])],
        ["Sprint 3", "13 h", "Módulo Mantenimiento v1: crear solicitud con foto + vista admin", Paragraph("✓ Completado", styles["OkLabel"])],
        ["Sprint 4", "13 h", "Mantenimiento v2: asignación + vista técnico + cierre + cámara móvil + confirmación residente", Paragraph("✓ Completado", styles["OkLabel"])],
        [
            "Sprint 5",
            "13 h",
            "Trazabilidad: audit log completo + vista admin con filtros + helper centralizado + notas obligatorias + perfil editable + carga técnico + foto rechazo",
            Paragraph("✓ Completado", styles["OkLabel"]),
        ],
        ["Sprint 6", "13 h (est.)", "Notificaciones Realtime + email simulado + foto cierre técnico + alertas residente rechaza + emergentes S5", Paragraph("→ Próximo", styles["WarnLabel"])],
        ["Sprints 7–14", "104 h (est.)", "E2E, CD, métricas, Facturación, Tienda, hardening, performance, seguridad, Twilio", Paragraph("■ Pendiente", styles["WarnLabel"])],
    ]
    s.append(grid_table(progress_header, progress_rows, [0.85 * inch, 0.95 * inch, 3.8 * inch, 1.0 * inch], styles))

    s.append(
        Paragraph(
            "<b>Total invertido:</b> 80 horas en 6 sprints (Sprint 0 → Sprint 5).<br/>"
            "<b>Total restante:</b> 117 horas estimadas en 9 sprints.<br/>"
            "<b>Velocidad promedio:</b> 13.3 horas/sprint (estable respecto a Sprints 3-4).",
            styles["Body"],
        )
    )
    s.append(Spacer(1, 8))

    s.append(Paragraph("Roadmap actualizado tras Sprint 5 Review", styles["H2"]))
    rm_header = ["Sprint", "Sem.", "Objetivo principal y nuevos módulos"]
    rm_rows = [
        ["Sprint 6", "8", "Notificaciones Realtime + email simulado + foto cierre técnico + emergentes Sprint 4/5 (S4-E01, S5-E02, S5-E03)"],
        ["Sprint 7", "9", "Calidad: Playwright instalado + suite E2E + threat model + checklist OWASP completo"],
        ["Sprint 8", "10", "CD a staging: deploy automático + endpoint /health + smoke tests (cierra DoD v2 al 100%)"],
        ["Sprint 9", "11", "Métricas + CSV + Facturación v1 (HU-FACT-01, 02, 03 — BD + admin emite + residente ve)"],
        ["Sprint 10", "12", "Hardening + Facturación v2 (HU-FACT-04 cobros) + Tienda v1 + HU-MANT-08 timeline + PBI-S5-E01 dashboard carga"],
        ["Sprint 11", "13", "Privacidad reforzada + Tienda v2 (carrito + integración con factura mensual)"],
        ["Sprint 12", "14", "Performance: Lighthouse + k6 + code splitting (incluye optimización de nuevos módulos)"],
        ["Sprint 13", "15", "Seguridad y observabilidad: OWASP completo + logging estructurado + alertas Vercel"],
        ["Sprint 14", "16", "★ Twilio Verify + Release Candidate + demo final (incluye trazabilidad, Facturación y Tienda en demo)"],
    ]
    s.append(grid_table(rm_header, rm_rows, [0.85 * inch, 0.55 * inch, 5.2 * inch], styles))
    s.append(
        Paragraph(
            "Nota de adaptación del roadmap: el Sprint 5 cerró trazabilidad sin desbordes. Los emergentes "
            "se reparten en Sprint 6 (E02, E03 de auditoría/perfil) y Sprint 10 (HU-MANT-08 + E01 de "
            "dashboard de carga). Capacidad de cada sprint sigue siendo 13 h + 2 h de buffer.",
            styles["Note"],
        )
    )
    s.append(Spacer(1, 8))

    s.append(Paragraph("Vista previa Sprint 6 — Notificaciones Realtime", styles["H2"]))
    s.append(Spacer(1, 6))
    s.append(quote_box(
        "Sprint 6: Notificaciones Supabase Realtime · Centro de notificaciones (campana) · "
            "Email simulado al cambio de estado · Foto de cierre por técnico · Alerta al admin "
            "cuando residente rechaza · Botón 'Ver auditoría' en drawer · Cambio de contraseña.",
        styles,
    ))
    preview_header = ["PBI", "Historia", "Horas est.", "Prior."]
    preview_rows = [
        ["PBI-12", "Notificaciones Supabase Realtime + email simulado al cambiar estado", "4 h", Paragraph("● P1", styles["FailLabel"])],
        ["HU-NOTIF-01", "Centro de notificaciones del usuario (campana en navbar con badge de no leídas)", "3 h", Paragraph("● P1", styles["FailLabel"])],
        ["HU-NOTIF-02", "Marcar notificación como leída + marcar todas como leídas", "1.5 h", Paragraph("● P2", styles["WarnLabel"])],
        ["PBI-S3-E01", "Foto de cierre por técnico al marcar resuelta (antes/después)", "1.5 h", Paragraph("● P2", styles["WarnLabel"])],
        ["PBI-S4-E01", "Notificar al admin cuando residente rechaza (cualquier rechazo)", "1 h", Paragraph("● P2", styles["WarnLabel"])],
        ["PBI-S5-E02", "Botón 'Ver auditoría' en drawer de solicitud (emergente Sprint 5)", "1 h", Paragraph("● P2", styles["WarnLabel"])],
        ["PBI-S5-E03", "Cambio de contraseña desde el perfil con contraseña actual (emergente Sprint 5)", "1 h", Paragraph("● P2", styles["WarnLabel"])],
    ]
    s.append(grid_table(preview_header, preview_rows, [1.1 * inch, 3.9 * inch, 0.8 * inch, 0.8 * inch], styles))
    s.append(Paragraph("<b>Total estimado Sprint 6:</b> 13 horas (2 h de buffer disponible).", styles["Body"]))
    s.append(Spacer(1, 10))

    s.append(Paragraph("Variables de entorno acumuladas al Sprint 5", styles["H2"]))
    s.append(Paragraph("Sin cambios respecto al Sprint 4. Las variables existentes siguen vigentes:", styles["Body"]))
    env_header = ["Variable", "Descripción", "Dónde se usa", "Desde Sprint"]
    env_rows = [
        ["VITE_SUPABASE_URL", "URL pública del proyecto Supabase", "Frontend (cliente JS) · test.env como dummy en CI", "Sprint 0"],
        ["VITE_SUPABASE_ANON_KEY", "Clave anónima de Supabase", "Frontend (cliente JS) · test.env como dummy en CI", "Sprint 0"],
        ["SUPABASE_SERVICE_ROLE_KEY", "Clave de servicio (admin) de Supabase", "Edge Functions (servidor)", "Sprint 3"],
        ["RESEND_API_KEY", "Clave de API de Resend para emails", "Edge Functions (servidor)", "Sprint 2"],
        ["SUPABASE_DB_URL", "URL de conexión directa a la BD", "Migraciones locales", "Sprint 0"],
    ]
    s.append(grid_table(env_header, env_rows, [1.9 * inch, 2.4 * inch, 1.6 * inch, 0.7 * inch], styles))
    s.append(Spacer(1, 6))
    s.append(
        Paragraph(
            "Variables proyectadas para futuros Sprints:<br/>"
            "• Sprint 6 (Notificaciones): posible RESEND_FROM_ADDRESS para customizar remitente.<br/>"
            "• Sprint 8 (CD): VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID para deploy automático.<br/>"
            "• Sprint 14 (Twilio): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID.",
            styles["Body"],
        )
    )
    s.append(
        Paragraph(
            "Ninguna de estas variables debe aparecer en el código fuente ni en commits. "
            "Todas van en .env.local (local) y en Secrets de GitHub/Vercel (CI/CD).",
            styles["Note"],
        )
    )

    s.append(Spacer(1, 14))
    s.append(
        Paragraph(
            "— Zity · Artefactos Sprint 5 · Documento vivo — actualizar en cada Sprint Review —",
            styles["Footer"],
        )
    )

    return s


# ─── Entry point ──────────────────────────────────────────────────────────────


def main() -> None:
    out_dir = os.path.join(os.path.dirname(__file__), "..", "docs", "sprints")
    out_dir = os.path.normpath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "Zity_Sprint5_Artefactos.pdf")

    styles = build_styles()
    doc = make_doc(out_path)
    story = build_story(styles)
    doc.build(story)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Generado: {out_path}  ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
