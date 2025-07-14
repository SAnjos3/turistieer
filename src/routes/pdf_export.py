from flask import Blueprint, request, jsonify, send_file
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from src.models.route import Route
import tempfile
import os
import json

pdf_export_bp = Blueprint("pdf_export", __name__)

@pdf_export_bp.route("/routes/<int:route_id>/export-pdf", methods=["GET"])
def export_route_to_pdf(route_id):
    """Exportar rota para PDF"""
    try:
        route = Route.query.get_or_404(route_id)
        
        # Criar arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_filename = temp_file.name
        temp_file.close()
        
        # Criar documento PDF
        doc = SimpleDocTemplate(temp_filename, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Título
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center
        )
        story.append(Paragraph("Rota: " + route.nome, title_style))
        story.append(Spacer(1, 20))
        
        # Informações da rota
        info_style = styles["Normal"]
        story.append(Paragraph("<b>Data de Início:</b> " + route.data_inicio.strftime("%d/%m/%Y às %H:%M"), info_style))
        story.append(Spacer(1, 10))
        
        # Pontos turísticos
        pontos = route.get_pontos_turisticos()
        if pontos:
            story.append(Paragraph("<b>Pontos Turísticos:</b>", styles["Heading2"]))
            story.append(Spacer(1, 10))
            
            # Criar tabela com pontos
            data = [["#", "Nome", "Descrição"]]
            for i, ponto in enumerate(pontos, 1):
                nome = ponto.get("nome", "N/A")
                descricao = ponto.get("descricao", "N/A")
                # Limitar descrição para caber na tabela
                if len(descricao) > 100:
                    descricao = descricao[:97] + "..."
                data.append([str(i), nome, descricao])
            
            table = Table(data, colWidths=[0.5*inch, 2*inch, 3.5*inch])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(table)
        
        # Rodapé
        story.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontSize=10,
            alignment=1,
            textColor=colors.grey
        )
        story.append(Paragraph("Gerado pela Plataforma de Turismo Inteligente", footer_style))
        
        # Construir PDF
        doc.build(story)
        
        # Retornar arquivo
        return send_file(
            temp_filename,
            as_attachment=True,
            download_name="rota_" + route.nome.replace(" ", "_") + ".pdf",
            mimetype="application/pdf"
        )
        
    except Exception as e:
        # Limpar arquivo temporário em caso de erro
        if "temp_filename" in locals() and os.path.exists(temp_filename):
            os.unlink(temp_filename)
        return jsonify({"error": str(e)}), 500



