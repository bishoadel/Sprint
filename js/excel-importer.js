/**
 * Toma el Rasol - Excel File Parser & Interactive Column Mapper
 */

window.TomaExcelImporter = {
  rawSheetData: [],
  excelHeaders: [],
  mappedData: [],

  // Process Uploaded File
  handleFileUpload: function (file) {
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      TomaUtils.showToast('Excel parser library (SheetJS) is loading, please try again.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse Sheet into JSON array of objects
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

        if (!json || json.length < 2) {
          throw new Error('The uploaded Excel sheet is empty or missing data rows.');
        }

        this.excelHeaders = json[0].map(h => String(h).trim());
        this.rawSheetData = json.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

        this.openColumnMappingModal();
      } catch (err) {
        TomaUtils.showToast('Failed to parse Excel file: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // Open Column Mapping Dialog
  openColumnMappingModal: function () {
    const nameSelect = document.getElementById('excel-map-name');
    const dobSelect = document.getElementById('excel-map-dob');

    if (!nameSelect || !dobSelect) return;

    const optionsHtml = `<option value="">-- Select Excel Column --</option>` +
      this.excelHeaders.map((h, i) => `<option value="${i}">${h}</option>`).join('');

    nameSelect.innerHTML = optionsHtml;
    dobSelect.innerHTML = optionsHtml;

    // Auto-detect matching headers
    this.excelHeaders.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes('name') || lower.includes('الاسم') || lower.includes('طفل')) {
        nameSelect.value = String(i);
      }
      if (lower.includes('dob') || lower.includes('birth') || lower.includes('تاريخ') || lower.includes('ميلاد')) {
        dobSelect.value = String(i);
      }
    });

    TomaUtils.openModal('modal-excel-mapping');
  },

  // Process Column Mapping & Generate Preview
  processMappingAndPreview: function () {
    const nameColIdx = document.getElementById('excel-map-name')?.value;
    const dobColIdx = document.getElementById('excel-map-dob')?.value;

    if (nameColIdx === "" || dobColIdx === "") {
      TomaUtils.showToast('Please select mapping for both Name and Birthdate.', 'error');
      return;
    }

    const nIdx = Number(nameColIdx);
    const dIdx = Number(dobColIdx);

    this.mappedData = this.rawSheetData.map((row, index) => {
      const rawName = row[nIdx] ? String(row[nIdx]).trim() : '';
      const rawDob = row[dIdx] ? String(row[dIdx]).trim() : '';

      // Validate Date Format (YYYY-MM-DD)
      let parsedDate = '';
      if (rawDob) {
        const d = new Date(rawDob);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toISOString().split('T')[0];
        }
      }

      const isValid = rawName.length > 1 && parsedDate.length === 10;

      return {
        rowIndex: index + 2,
        name: rawName,
        birth_date: parsedDate,
        rawDob: rawDob,
        isValid: isValid
      };
    });

    this.renderPreviewTable();
    TomaUtils.closeModal('modal-excel-mapping');
    TomaUtils.openModal('modal-excel-preview');
  },

  // Render Data Preview Modal
  renderPreviewTable: function () {
    const container = document.getElementById('excel-preview-container');
    const summaryElem = document.getElementById('excel-preview-summary');
    if (!container) return;

    const validCount = this.mappedData.filter(d => d.isValid).length;
    const invalidCount = this.mappedData.length - validCount;

    if (summaryElem) {
      summaryElem.innerHTML = `
        Found <strong>${this.mappedData.length}</strong> total records from Excel.
        <span style="color:#10B981; font-weight:700;">${validCount} Valid</span>, 
        <span style="color:#EF4444; font-weight:700;">${invalidCount} Invalid/Missing</span>.
      `;
    }

    container.innerHTML = `
      <div class="table-responsive" style="max-height:300px; overflow-y:auto;">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Row #</th>
              <th>Child Name</th>
              <th>Birthdate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.mappedData.map(item => `
              <tr style="${item.isValid ? '' : 'background:#FEF2F2;'}">
                <td>${item.rowIndex}</td>
                <td><strong>${item.name || '<span style="color:#EF4444;">Missing Name</span>'}</strong></td>
                <td>${item.birth_date || `<span style="color:#EF4444;">Invalid Date (${item.rawDob})</span>`}</td>
                <td>
                  <span class="badge ${item.isValid ? 'badge-success' : 'badge-danger'}">
                    ${item.isValid ? 'READY' : 'ERROR'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // Final Batch Commit to Database
  confirmBatchImport: async function () {
    const validRecords = this.mappedData.filter(d => d.isValid);

    if (validRecords.length === 0) {
      TomaUtils.showToast('No valid records to import.', 'error');
      return;
    }

    try {
      let importedCount = 0;
      for (const rec of validRecords) {
        await TomaDB.createChild({
          name: rec.name,
          birth_date: rec.birth_date
        });
        importedCount++;
      }

      TomaUtils.showToast(`Successfully imported ${importedCount} children from Excel!`, 'success');
      TomaUtils.closeModal('modal-excel-preview');

      // Refresh Kashf
      if (window.TomaChildren) {
        await window.TomaChildren.loadChildren();
      }
    } catch (err) {
      TomaUtils.showToast('Import Error: ' + err.message, 'error');
    }
  }
};
