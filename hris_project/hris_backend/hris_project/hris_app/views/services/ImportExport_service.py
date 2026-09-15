import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from django.http import HttpResponse
from django.apps import apps
import datetime

class DynamicExcelService:
    @staticmethod
    def export_data(queryset, selected_fields, filename="Export_Data"):
        """
        Export queryset berdasarkan urutan & daftar field di selected_fields template
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Data Export"

        # Styling Header
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
        border_style = Side(border_style="thin", color="CCCCCC")
        cell_border = Border(left=border_style, right=border_style, top=border_style, bottom=border_style)

        # 1. Tulis Header berdasarkan Urutan di Template
        headers = [item['label'] for item in selected_fields]
        ws.append(headers)

        for col_num, cell in enumerate(ws[1], 1):
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # 2. Tulis Baris Data sesuai urutan field
        for obj in queryset:
            row_data = []
            for item in selected_fields:
                field_name = item['field']
                val = getattr(obj, field_name, None)

                # Format ForeignKey / Relasi
                if hasattr(val, 'name'):
                    val = val.name
                elif hasattr(val, 'nama_department'):
                    val = val.nama_department

                # Format Tanggal
                if isinstance(val, (datetime.date, datetime.datetime)):
                    val = val.strftime("%Y-%m-%d")

                row_data.append(str(val) if val is not None else "")
            
            ws.append(row_data)

        # Auto-adjust Lebar Kolom
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
        wb.save(response)
        return response

    @staticmethod
    def import_data(file_obj, model_class, selected_fields):
        """
        Import data dari Excel sesuai mapping template ke Model Database
        """
        wb = openpyxl.load_workbook(file_obj)
        ws = wb.active

        headers = [cell.value for cell in ws[1]]
        
        # Mapping nama header Excel ke field_name di database
        label_to_field = {item['label']: item['field'] for item in selected_fields}

        success_count = 0
        errors = []

        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not any(row):
                continue  # Skip baris kosong

            row_dict = {}
            for header_val, cell_val in zip(headers, row):
                if header_val in label_to_field:
                    field_name = label_to_field[header_val]
                    # Ubah string kosong menjadi None
                    if isinstance(cell_val, str) and cell_val.strip() == "":
                        cell_val = None
                    row_dict[field_name] = cell_val

            try:
                # Simpan atau update data
                model_class.objects.create(**row_dict)
                success_count += 1
            except Exception as e:
                errors.append(f"Baris {row_idx}: {str(e)}")

        return success_count, errors