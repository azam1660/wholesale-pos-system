from flask import Flask, request, jsonify, render_template_string, redirect, url_for, send_from_directory
import subprocess
import tempfile
import os
import platform
import json
from datetime import datetime
from flask_cors import CORS
import time
import re
from typing import Optional, Dict, Any
import webbrowser
from bs4 import BeautifulSoup # Import BeautifulSoup for HTML parsing

# Optional imports with fallbacks
WINDOWS_PRINT_AVAILABLE = False
try:
    import win32print
    import win32api
    WINDOWS_PRINT_AVAILABLE = True
except ImportError:
    print("Windows print modules (pywin32) not available. Direct Windows printing will use fallback methods.")

app = Flask(__name__, template_folder='templates')

# Enhanced CORS configuration
CORS(app,
     origins=['*'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials'],
     supports_credentials=True)

class HybridThermalPrinter:
    def __init__(self, paper_width_mm=80, dots_per_mm=8, font_width_chars=12, font_height_dots=24):
        self.system = platform.system()
        self.temp_files = []
        # These values are for a typical 80mm thermal printer, adjust as needed
        self.paper_width_mm = paper_width_mm
        self.dots_per_mm = dots_per_mm
        self.font_width_chars = font_width_chars # Approximate characters per mm for a typical font
        self.font_height_dots = font_height_dots # Approximate dots per character height
        self.paper_width_dots = int(self.paper_width_mm * self.dots_per_mm)
        self.paper_width_chars = int(self.paper_width_dots / self.font_width_chars) # Calculated characters per line

        # Fallback to 48 characters if calculation is off or not set
        if self.paper_width_chars <= 0:
            self.paper_width_chars = 48 # Optimized for 79mm thermal paper

    def get_available_printers(self):
        """Get list of available printers"""
        try:
            printers = []
            if self.system == "Windows":
                if WINDOWS_PRINT_AVAILABLE:
                    try:
                        all_printers = win32print.EnumPrinters(
                            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
                        printers = [printer[2] for printer in all_printers]
                    except Exception as e:
                        print(f"win32print error: {e}")
                        printers = self._get_windows_printers_fallback()
                else:
                    printers = self._get_windows_printers_fallback()
            elif self.system == "Darwin":  # macOS
                printers = self._get_macos_printers()
            else:  # Linux
                printers = self._get_linux_printers()
            if not printers:
                printers = ["Default Printer"]
            return printers
        except Exception as e:
            print(f"Error getting printers: {e}")
            return ["Default Printer"]

    def _get_windows_printers_fallback(self):
        """Fallback method for Windows printer detection"""
        try:
            result = subprocess.run(['wmic', 'printer', 'get', 'name'],
                                  capture_output=True, text=True, shell=True, timeout=10)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                printers = []
                for line in lines[1:]:  # Skip header
                    if line.strip() and line.strip() != "Name":
                        printers.append(line.strip())
                return printers
        except Exception as e:
            print(f"WMIC error: {e}")
        return ["Default Printer"]

    def _get_macos_printers(self):
        """Get printers on macOS"""
        try:
            result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True, timeout=10)
            printers = []
            for line in result.stdout.split('\n'):
                if 'printer' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        printers.append(parts[1])
            return printers
        except Exception as e:
            print(f"macOS printer detection error: {e}")
            return ["Default Printer"]

    def _get_linux_printers(self):
        """Get printers on Linux"""
        try:
            result = subprocess.run(['lpstat', '-p'], capture_output=True, text=True, timeout=10)
            printers = []
            for line in result.stdout.split('\n'):
                if 'printer' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        printers.append(parts[1])
            return printers
        except Exception as e:
            print(f"Linux printer detection error: {e}")
            return ["Default Printer"]

    def html_to_full_text(self, html_content: str) -> str:
        """Convert HTML to 79mm (48 characters) width thermal printer text with improved table formatting."""
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove inline styles and script tags that might interfere
        for tag in soup.find_all(style=True):
            del tag['style']
        for script in soup(["script", "style"]):
            script.extract()

        # Define column widths for a typical 4-column receipt table (adjust for self.paper_width_chars)
        # Item (24), Qty (4), Rate (8), Amount (8) = 44 chars. Add 1 space between each column.
        # Total = 24 + 1 + 4 + 1 + 8 + 1 + 8 = 47 chars. This fits 48.
        col_widths = [24, 4, 8, 8]
        col_separator = " " # Single space separator

        # Helper to wrap text within a given width and indent subsequent lines
        def wrap_and_indent(content, target_width, indent_str=""):
            lines = []
            current_line_buffer = []
            words = content.split(' ')

            for word in words:
                # Determine the effective width for the current line based on whether it's the first line or not
                is_first_segment_of_wrapped_output = not lines and not current_line_buffer
                effective_width_for_current_line = target_width if is_first_segment_of_wrapped_output else (target_width - len(indent_str))

                # Calculate length if the current word is added to the buffer
                test_line_len = len(' '.join(current_line_buffer)) + (1 if current_line_buffer else 0) + len(word)

                # If the word itself is longer than the effective width, break it
                if len(word) > effective_width_for_current_line:
                    if current_line_buffer: # Flush existing buffer if any
                        lines.append(' '.join(current_line_buffer))
                        current_line_buffer = []
                    # Break the long word
                    remaining_word = word
                    while len(remaining_word) > effective_width_for_current_line:
                        lines.append(remaining_word[:effective_width_for_current_line])
                        remaining_word = remaining_word[effective_width_for_current_line:]
                        # After the first part of a broken word, subsequent parts are indented
                        effective_width_for_current_line = target_width - len(indent_str) # Apply indent for subsequent parts
                    if remaining_word:
                        current_line_buffer.append(remaining_word)
                else:
                    # Check if adding the word exceeds the current line's capacity
                    if test_line_len > effective_width_for_current_line and current_line_buffer:
                        lines.append(' '.join(current_line_buffer))
                        current_line_buffer = [word]
                    else:
                        current_line_buffer.append(word)

            if current_line_buffer:
                lines.append(' '.join(current_line_buffer))

            # Final formatting with padding and indentation
            formatted_lines = []
            for i, line in enumerate(lines):
                if i == 0:
                    # First line of the wrapped output, no indent, just pad to target_width
                    formatted_lines.append(line.ljust(target_width)[:target_width])
                else:
                    # Subsequent lines, apply indent and then pad to target_width
                    indented_line = indent_str + line
                    formatted_lines.append(indented_line.ljust(target_width)[:target_width])
            return formatted_lines

        # Process tables first using a callback
        def format_table_match(match):
            table_html = match.group(0) # Get the whole table HTML
            table_soup = BeautifulSoup(table_html, 'html.parser')
            formatted_table_lines = []
            # Extract data rows (tr tags directly under table, assuming no thead)
            data_rows_html = table_soup.find_all('tr')
            for row_html in data_rows_html:
                data_cells = [re.sub(r'<[^>]+>', '', str(cell)).strip() for cell in row_html.find_all(['td', 'th'])]

                item_name = data_cells[0] if len(data_cells) > 0 else ""
                qty = data_cells[1] if len(data_cells) > 1 else ""
                rate = data_cells[2] if len(data_cells) > 2 else ""
                amount = data_cells[3] if len(data_cells) > 3 else ""

                # Format other columns (right-aligned for numbers)
                formatted_qty = qty.rjust(col_widths[1])
                formatted_rate = rate.rjust(col_widths[2])
                formatted_amount = amount.rjust(col_widths[3])

                # Item name wrapping with indent for subsequent lines
                # Indent for subsequent lines is the width of the item column
                item_lines = wrap_and_indent(item_name, col_widths[0], indent_str=" " * col_widths[0])

                # First line of item row
                first_item_line_content = item_lines[0] # This is already padded/truncated by wrap_and_indent
                formatted_table_lines.append(
                    f"{first_item_line_content}{col_separator}{formatted_qty}{col_separator}{formatted_rate}{col_separator}{formatted_amount}"
                )
                # Subsequent lines for wrapped item name
                for i in range(1, len(item_lines)):
                    # These lines are already indented and padded by wrap_and_indent
                    formatted_table_lines.append(item_lines[i])
            return '\n' + '\n'.join(formatted_table_lines) + '\n'

        # Replace tables with formatted text
        for table_tag in soup.find_all('table'):
            table_text = format_table_match(re.match(r'(<table.*?</table>)', str(table_tag), re.IGNORECASE | re.DOTALL))
            table_tag.replace_with(table_text)

        # General HTML tag removal and cleanup for non-table content
        # Replace <br> with newline
        for br_tag in soup.find_all('br'):
            br_tag.replace_with('\n')

        # Replace <hr> with dashed line
        for hr_tag in soup.find_all('hr'):
            hr_tag.replace_with('\n' + '-' * self.paper_width_chars + '\n')

        # Handle headings (h1-h6)
        for h_tag in soup.find_all(re.compile('^h[1-6]$')):
            h_tag.replace_with(f'\n{h_tag.get_text().strip()}\n')

        # Handle paragraphs
        for p_tag in soup.find_all('p'):
            p_tag.replace_with(f'{p_tag.get_text().strip()}\n')

        # Handle strong/b tags
        for strong_tag in soup.find_all(['strong', 'b']):
            strong_tag.replace_with(strong_tag.get_text().strip())

        # Special handling for totals div to format key-value pairs
        for totals_div in soup.find_all('div', class_='totals'):
            lines = []
            for p_tag in totals_div.find_all('p'):
                span_contents = [span.get_text().strip() for span in p_tag.find_all('span')]
                if len(span_contents) == 2:
                    label = span_contents[0]
                    value = span_contents[1]
                    label_str = f"{label}:"
                    padding_needed = self.paper_width_chars - len(label_str) - len(value)
                    if padding_needed >= 0:
                        formatted_line = f"{label_str}{' ' * padding_needed}{value}"
                    else:
                        truncated_label_len = self.paper_width_chars - len(value) - 1
                        if truncated_label_len > 0:
                            label_str = f"{label[:truncated_label_len]}:"
                            formatted_line = f"{label_str}{value.rjust(self.paper_width_chars - len(label_str))}"
                        else:
                            formatted_line = value.rjust(self.paper_width_chars)
                    lines.append(formatted_line)
                else:
                    lines.append(p_tag.get_text().strip())
            totals_div.replace_with('\n' + '\n'.join(lines) + '\n')

        # Get the final text after all replacements
        text = soup.get_text()

        # Clean up HTML entities
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&quot;', '"')

        # Clean up excessive whitespace but preserve intentional formatting
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)  # Max 2 consecutive newlines
        text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces to single space
        text = text.strip()

        # Now, apply word wrapping to all lines to ensure self.paper_width_chars width
        final_lines = []
        for line in text.split('\n'):
            line = line.strip() # Trim leading/trailing spaces from the line itself
            if not line:
                final_lines.append('')
                continue

            # Handle centering for specific lines (e.g., header, footer, item header)
            # Check for common header/footer phrases to center them
            if any(phrase in line.upper() for phrase in ["TEST STORE", "SAMPLE STORE", "THANK YOU FOR YOUR BUSINESS", "TERMS & CONDITIONS APPLY", "VISIT US AGAIN SOON", "123 MAIN STREET", "PH: (555) 123-4567", "ITEM QTY RATE AMOUNT", "ITEM QTY PRICE TOTAL"]):
                final_lines.append(line.center(self.paper_width_chars))
                continue

            # For other general text, apply word wrapping
            wrapped_lines = wrap_and_indent(line, self.paper_width_chars)
            final_lines.extend(wrapped_lines)

        # Add paper cut spacing at the end
        formatted_text = '\n'.join(final_lines)
        formatted_text += '\n\n\n\n'
        return formatted_text

    def create_temp_file(self, content: str, suffix: str = '.txt', encoding: str = 'utf-8') -> str:
        """Create temporary file"""
        try:
            # Use tempfile.mkstemp to create a unique temporary file
            fd, path = tempfile.mkstemp(suffix=suffix, encoding=encoding)
            with os.fdopen(fd, 'w', encoding=encoding) as tmp:
                tmp.write(content)
            self.temp_files.append(path)
            return path
        except Exception as e:
            print(f"Error creating temp file: {e}")
            raise

    def create_printable_html_for_browser(self, html_content: str) -> str:
        """Create HTML file optimized for browser printing with auto-print script and 79mm CSS"""
        # Add 79mm specific CSS for browser rendering
        thermal_css = """
        <style>
            @page {
                size: 79mm auto; /* Set paper size for print dialog */
                margin: 0;
            }
            body {
                width: 79mm;
                max-width: 79mm;
                margin: 0;
                padding: 2mm;
                font-family: "Courier New", monospace;
                font-size: 9pt;
                line-height: 1.2;
                color: #000;
                background: white;
            }
            * {
                max-width: 75mm; /* Ensure content fits within printable area */
                word-wrap: break-word;
            }
            h1, h2, h3 {
                font-size: 10pt;
                margin: 2px 0;
                padding: 2px 0;
                font-weight: bold;
            }
            p {
                margin: 1px 0;
                padding: 1px 0;
            }
            hr {
                border: none;
                border-top: 1px dashed #000;
                margin: 3px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 8pt;
                margin: 2px 0;
            }
            th, td {
                padding: 1px 1px;
                text-align: left;
                border-bottom: 1px dotted #000;
                word-break: break-word;
            }
            th {
                font-weight: bold;
                background: #f0f0f0;
            }
            .totals {
                margin-top: 5px;
                font-size: 9pt;
            }
            .totals p {
                display: flex;
                justify-content: space-between;
                margin: 1px 0;
            }
            .total {
                font-weight: bold;
                font-size: 10pt;
                border-top: 1px solid #000;
                padding-top: 2px;
            }
            .footer {
                margin-top: 8px;
                text-align: center;
                font-size: 7pt;
            }
            .center {
                text-align: center;
            }
            @media print {
                body {
                    width: 79mm !important;
                    max-width: 79mm !important;
                }
            }
        </style>
        """
        # Add auto-print JavaScript to the HTML
        auto_print_script = """
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                    // Optional: Close window after printing
                    // setTimeout(function() { window.close(); }, 1000);
                }, 500);
            };
        </script>
        """
        # Insert the script and CSS into the HTML
        full_html = f'<!DOCTYPE html><html><head>{thermal_css}</head><body>{html_content}{auto_print_script}</body></html>'
        # Replace template variables if any (e.g., {{ current_time }})
        full_html = full_html.replace('{{ current_time }}', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        return self.create_temp_file(full_html, suffix='.html')

    def create_preview_html_file(self, html_content: str):
        """Create HTML file optimized for preview (no auto-print script) with 79mm CSS"""
        # Add 79mm specific CSS for browser rendering
        thermal_css = """
        <style>
            @page {
                size: 79mm auto; /* Set paper size for print dialog */
                margin: 0;
            }
            body {
                width: 79mm;
                max-width: 79mm;
                margin: 0;
                padding: 2mm;
                font-family: "Courier New", monospace;
                font-size: 9pt;
                line-height: 1.2;
                color: #000;
                background: white;
            }
            * {
                max-width: 75mm; /* Ensure content fits within printable area */
                word-wrap: break-word;
            }
            h1, h2, h3 {
                font-size: 10pt;
                margin: 2px 0;
                padding: 2px 0;
                font-weight: bold;
            }
            p {
                margin: 1px 0;
                padding: 1px 0;
            }
            hr {
                border: none;
                border-top: 1px dashed #000;
                margin: 3px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 8pt;
                margin: 2px 0;
            }
            th, td {
                padding: 1px 1px;
                text-align: left;
                border-bottom: 1px dotted #000;
                word-break: break-word;
            }
            th {
                font-weight: bold;
                background: #f0f0f0;
            }
            .totals {
                margin-top: 5px;
                font-size: 9pt;
            }
            .totals p {
                display: flex;
                justify-content: space-between;
                margin: 1px 0;
            }
            .total {
                font-weight: bold;
                font-size: 10pt;
                border-top: 1px solid #000;
                padding-top: 2px;
            }
            .footer {
                margin-top: 8px;
                text-align: center;
                font-size: 7pt;
            }
            .center {
                text-align: center;
            }
            @media print {
                body {
                    width: 79mm !important;
                    max-width: 79mm !important;
                }
            }
        </style>
        """
        # Insert the CSS into the HTML
        full_html = f'<!DOCTYPE html><html><head>{thermal_css}</head><body>{html_content}</body></html>'
        # Replace template variables if any (e.g., {{ current_time }})
        full_html = full_html.replace('{{ current_time }}', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        return self.create_temp_file(full_html, suffix='.html')

    def print_via_browser(self, html_content: str):
        """Print using browser method (opens print dialog)"""
        try:
            file_basename = self.create_printable_html_for_browser(html_content)
            # Return only the filename, Flask will serve it from temp directory
            return file_basename
        except Exception as e:
            print(f"Browser print error: {e}")
            return None

    def print_via_direct(self, html_content: str, printer_name: str) -> bool:
        """Main direct print method (bypasses dialog)"""
        print(f"\n🖨️ Starting DIRECT print to: {printer_name}")
        print(f"📄 HTML content length: {len(html_content)} characters")
        print(f"💻 System: {self.system}")
        print(f"📏 Paper width: 79mm ({self.paper_width_chars} characters)")
        print("🚫 NO PRINT DIALOG - Sending raw text directly")
        try:
            if self.system == "Windows":
                return self.print_via_windows_direct(html_content, printer_name)
            else:
                return self.print_via_unix(html_content, printer_name)
        except Exception as e:
            print(f"❌ Direct print failed: {e}")
            return False

    def print_via_windows_direct(self, html_content: str, printer_name: str) -> bool:
        """Direct Windows printing using win32print"""
        if not WINDOWS_PRINT_AVAILABLE:
            return self.print_via_windows_fallback(html_content, printer_name)
        try:
            # Convert HTML to 79mm (48 characters) optimized text
            raw_text = self.html_to_full_text(html_content)
            print(f"Attempting raw print to: {printer_name}")
            print(f"Text content length: {len(raw_text)} characters")
            # Open printer
            hPrinter = win32print.OpenPrinter(printer_name)
            try:
                # Start document
                doc_info = ("Raw Thermal Receipt", None, "RAW")
                hJob = win32print.StartDocPrinter(hPrinter, 1, doc_info)
                win32print.StartPagePrinter(hPrinter)
                # Add ESC/POS commands for 79mm width (optional, printer might handle it)
                # These commands are more reliable for direct ESC/POS printers.
                # For generic Windows drivers, they might be ignored.
                esc_commands = b'\x1B\x40'  # Initialize printer
                esc_commands += b'\x1B\x61\x00'  # Left align
                # esc_commands += b'\x1D\x57\x02\x00'  # Set print area width (79mm) - often not needed for RAW
                win32print.WritePrinter(hPrinter, esc_commands)
                # Send data
                data = raw_text.encode('utf-8', errors='ignore')
                win32print.WritePrinter(hPrinter, data)
                # Add paper cut command
                cut_command = b'\x1D\x56\x00'  # Full cut
                win32print.WritePrinter(hPrinter, cut_command)
                # End document
                win32print.EndPagePrinter(hPrinter)
                win32print.EndDocPrinter(hPrinter)
                print("✅ Raw print job sent successfully via win32print")
                return True
            finally:
                win32print.ClosePrinter(hPrinter)
        except Exception as e:
            print(f"Windows direct print error: {e}")
            return self.print_via_windows_fallback(html_content, printer_name)

    def print_via_windows_fallback(self, html_content: str, printer_name: str) -> bool:
        """Fallback Windows printing using system commands"""
        try:
            # Convert HTML to 79mm (48 characters) optimized text
            raw_text = self.html_to_full_text(html_content)
            # Create temp file
            temp_file = self.create_temp_file(raw_text, suffix='.txt')
            print(f"Using fallback method for printer: {printer_name}")
            print(f"Temp file created: {temp_file}")
            success = False
            # Method 1: PowerShell with Out-Printer
            try:
                ps_cmd = f'Get-Content "{temp_file}" | Out-Printer -Name "{printer_name}"'
                result = subprocess.run(['powershell', '-Command', ps_cmd],
                                      capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    print("✅ Print successful via PowerShell")
                    success = True
                else:
                    print(f"PowerShell print failed: {result.stderr}")
            except Exception as e:
                print(f"PowerShell print error: {e}")
            # Method 2: Direct print command
            if not success:
                try:
                    if printer_name.lower() != "default printer":
                        cmd = f'print /D:"{printer_name}" "{temp_file}"'
                    else:
                        cmd = f'print "{temp_file}"'
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
                    if result.returncode == 0:
                        print("✅ Print successful via print command")
                        success = True
                    else:
                        print(f"Print command failed: {result.stderr}")
                except Exception as e:
                    print(f"Print command error: {e}")
            # Method 3: Notepad as last resort (still no dialog)
            if not success:
                try:
                    if printer_name.lower() != "default printer":
                        notepad_cmd = f'notepad.exe /p /d:"{printer_name}" "{temp_file}"'
                    else:
                        notepad_cmd = f'notepad.exe /p "{temp_file}"'
                    subprocess.Popen(notepad_cmd, shell=True)
                    print("✅ Print initiated via Notepad")
                    success = True
                except Exception as e:
                    print(f"Notepad print error: {e}")
            # Clean up temp file after delay
            def cleanup_temp_file_delayed():
                time.sleep(10) # Give enough time for print spooler to pick up
                try:
                    if os.path.exists(temp_file):
                        os.unlink(temp_file)
                        print(f"Cleaned up temp file: {temp_file}")
                except Exception as e:
                    print(f"Cleanup error: {e}")
            import threading
            threading.Thread(target=cleanup_temp_file_delayed, daemon=True).start()
            return success
        except Exception as e:
            print(f"Windows fallback print error: {e}")
            return False

    def print_via_unix(self, html_content: str, printer_name: str) -> bool:
        """Print on Unix systems"""
        try:
            # Convert HTML to 79mm (48 characters) optimized text
            raw_text = self.html_to_full_text(html_content)
            # Create temp file
            temp_file = self.create_temp_file(raw_text, suffix='.txt')
            try:
                # Send to printer using lpr
                if printer_name and printer_name.lower() != "default printer":
                    cmd = ['lpr', '-P', printer_name, temp_file]
                else:
                    cmd = ['lpr', temp_file]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                success = result.returncode == 0
                if success:
                    print("✅ Raw print successful via lpr")
                else:
                    print(f"lpr error: {result.stderr}")
                return success
            finally:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
        except Exception as e:
            print(f"Unix print error: {e}")
            return False

    def cleanup_temp_files(self):
        """Clean up temporary files"""
        for file_path in self.temp_files:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    print(f"Cleaned up: {file_path}")
            except Exception as e:
                print(f"Cleanup error for {file_path}: {e}")
        self.temp_files.clear()

# Initialize printer
thermal_printer = HybridThermalPrinter()

# Add OPTIONS handler for preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'OK'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.route('/')
def index():
    """Serve the main test page"""
    # Load HTML from file and replace template variables
    with open(os.path.join('index.html'), 'r', encoding='utf-8') as f:
        html_content = f.read()
    return render_template_string(html_content, current_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

@app.route('/favicon.ico')
def favicon():
    """Handle favicon requests"""
    return '', 204

@app.route('/sample-receipt')
def sample_receipt_page():
    """Serve a pre-defined sample receipt page that triggers print dialog"""
    try:
        # Load HTML from file
        with open(os.path.join(app.template_folder, 'sample_receipt.html'), 'r', encoding='utf-8') as f:
            sample_html_content = f.read()
        # Generate the printable HTML for the sample receipt
        file_basename = thermal_printer.print_via_browser(sample_html_content)
        if file_basename:
            # Redirect to the temporary file URL to trigger browser print
            return redirect(url_for('serve_print_file', filename=file_basename))
        else:
            raise Exception("Failed to create printable file for sample receipt.")
    except Exception as e:
        print(f"Error generating sample receipt page: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate sample receipt: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/health')
def health_check():
    return jsonify({
        'success': True,
        'message': 'Hybrid Thermal Print Utility is running',
        'timestamp': datetime.now().isoformat(),
        'system': platform.system(),
        'windows_print_available': WINDOWS_PRINT_AVAILABLE,
        'paper_width_chars_for_direct_print': thermal_printer.paper_width_chars,
        'features': [
            'Browser Print (with dialog)',
            'Direct Print (no dialog, 79mm/48-char optimized)',
            'Print Preview (no dialog)',
            '79mm width optimization for browser print',
            'Raw text printing for direct print',
            'Multiple fallback methods',
            'Dedicated sample receipt page'
        ]
    })

@app.route('/api/printers')
def get_printers():
    try:
        print("🔍 Detecting available printers...")
        printers = thermal_printer.get_available_printers()
        print(f"📋 Found {len(printers)} printers: {printers}")
        return jsonify({
            'success': True,
            'printers': printers,
            'count': len(printers),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"❌ Printer detection error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/print', methods=['POST'])
def print_document():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        if 'html' not in data:
            return jsonify({
                'success': False,
                'error': 'HTML content is required'
            }), 400

        html_content = data['html']
        printer_name = data.get('printer', 'Default Printer')
        print_method = data.get('method', 'browser') # Default to browser print

        if not html_content or not isinstance(html_content, str):
            return jsonify({
                'success': False,
                'error': 'HTML content must be a non-empty string'
            }), 400

        print(f"\n📨 Received print request:")
        print(f"   Method: {print_method}")
        print(f"   Printer: {printer_name}")
        print(f"   HTML length: {len(html_content)} characters")
        print(f"   Origin: {request.headers.get('Origin', 'Not specified')}")

        if print_method == 'browser':
            file_basename = thermal_printer.print_via_browser(html_content)
            if file_basename:
                # Construct the full URL for the client to open
                print_url = url_for('serve_print_file', filename=file_basename, _external=True)
                return jsonify({
                    'success': True,
                    'message': 'Print job prepared for browser printing',
                    'print_url': print_url,
                    'method': 'browser',
                    'timestamp': datetime.now().isoformat()
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to prepare browser print job',
                    'method': 'browser',
                    'timestamp': datetime.now().isoformat()
                }), 500
        elif print_method == 'direct':
            success = thermal_printer.print_via_direct(html_content, printer_name)
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Direct print job sent successfully',
                    'printer': printer_name,
                    'method': 'direct',
                    'timestamp': datetime.now().isoformat()
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to send direct print job to printer',
                    'printer': printer_name,
                    'method': 'direct',
                    'timestamp': datetime.now().isoformat()
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid print method specified. Use "browser" or "direct".',
                'timestamp': datetime.now().isoformat()
            }), 400
    except Exception as e:
        print(f"❌ Print API error: {e}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/preview', methods=['POST'])
def preview_html():
    """Generate an HTML preview of the content without triggering print dialog"""
    try:
        data = request.get_json()
        if not data or 'html' not in data:
            return jsonify({
                'success': False,
                'error': 'HTML content is required'
            }), 400

        html_content = data['html']
        if not html_content or not isinstance(html_content, str):
            return jsonify({
                'success': False,
                'error': 'HTML content must be a non-empty string'
            }), 400

        print(f"\n📨 Received preview request:")
        print(f"   HTML length: {len(html_content)} characters")
        print(f"   Origin: {request.headers.get('Origin', 'Not specified')}")

        file_basename = thermal_printer.create_preview_html_file(html_content)
        if file_basename:
            preview_url = url_for('serve_print_file', filename=os.path.basename(file_basename), _external=True)
            print(f"✅ Preview URL generated: {preview_url}")
            return jsonify({
                'success': True,
                'message': 'Preview generated successfully',
                'preview_url': preview_url,
                'timestamp': datetime.now().isoformat()
            })
        else:
            raise Exception("Failed to create preview file.")
    except Exception as e:
        print(f"❌ Preview API error: {e}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/print_file/<path:filename>')
def serve_print_file(filename):
    """Serve temporary print files for browser printing"""
    try:
        # Security check - ensure filename doesn't contain directory traversal attempts
        if '..' in filename:
            return jsonify({'error': 'Invalid file path'}), 403

        # Serve the file from the system's temporary directory
        temp_dir = tempfile.gettempdir()
        return send_from_directory(temp_dir, filename, mimetype='text/html')
    except Exception as e:
        print(f"Error serving file {filename}: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'available_endpoints': ['/', '/sample-receipt', '/api/health', '/api/printers', '/api/print', '/api/preview']
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# Cleanup on exit
import atexit
atexit.register(thermal_printer.cleanup_temp_files)

if __name__ == '__main__':
    print("🖨️ Hybrid Thermal Print Utility Starting...")
    print("✅ Supports Browser Print (with dialog) and Direct Print (no dialog)")
    print("👁️ New: Print Preview (opens in browser tab without dialog)")
    print("🌐 CORS: All origins allowed")
    print("📝 Enhanced error handling and logging")
    print("🌐 Server: http://localhost:5000")
    print("📄 Main Test page: http://localhost:5000")
    print("📄 Sample Receipt page: http://localhost:5000/sample-receipt")
    app.run(debug=True, host='0.0.0.0', port=5000)
