import PDFDocument from "pdfkit";

interface TransactionReceiptData {
    transactionId: number;
    transactionReference: string;
    transactionDate: Date | string;
    senderAccount: string;
    receiverName: string | null;
    receiverAccount: string;
    amount: number;
    transactionType: string;
    status: string;
    remarks: string | null;
    updatedAt: Date | string;
}

export function generateTransactionReceiptPdf(
    transaction: TransactionReceiptData
): PDFKit.PDFDocument {

    const doc = new PDFDocument({
        size: "A4",
        margin: 50
    });

    /*
     * ============================================================
     * HEADER
     * ============================================================
     */

    doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("DIGITAL BANKING", {
            align: "center"
        });

    doc
        .moveDown(0.5)
        .fontSize(16)
        .font("Helvetica")
        .text("Transaction Receipt", {
            align: "center"
        });

    doc.moveDown(1);

    /*
     * ============================================================
     * TRANSACTION STATUS
     * ============================================================
     */

    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(
            `Status: ${transaction.status}`,
            {
                align: "center"
            }
        );

    doc.moveDown(1.5);

    /*
     * ============================================================
     * AMOUNT
     * ============================================================
     */

    doc
        .fontSize(12)
        .font("Helvetica")
        .text("Transaction Amount", {
            align: "center"
        });

    doc
        .moveDown(0.3)
        .fontSize(26)
        .font("Helvetica-Bold")
        .text(
            `₹ ${transaction.amount.toFixed(2)}`,
            {
                align: "center"
            }
        );

    doc.moveDown(2);

    /*
     * ============================================================
     * TRANSACTION DETAILS
     * ============================================================
     */

    doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("Transaction Details");

    doc.moveDown(0.5);

    addRow(
        doc,
        "Transaction ID",
        String(transaction.transactionId)
    );

    addRow(
        doc,
        "Transaction Reference",
        transaction.transactionReference
    );

    addRow(
        doc,
        "Transaction Type",
        transaction.transactionType
    );

    addRow(
        doc,
        "Transaction Date",
        formatDate(transaction.transactionDate)
    );

    addRow(
        doc,
        "Last Updated",
        formatDate(transaction.updatedAt)
    );

    doc.moveDown(1);

    /*
     * ============================================================
     * ACCOUNT DETAILS
     * ============================================================
     */

    doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("Account Details");

    doc.moveDown(0.5);

    addRow(
        doc,
        "Sender Account",
        maskAccount(transaction.senderAccount)
    );

    addRow(
        doc,
        "Receiver Name",
        transaction.receiverName || "N/A"
    );

    addRow(
        doc,
        "Receiver Account",
        maskAccount(transaction.receiverAccount)
    );

    doc.moveDown(1);

    /*
     * ============================================================
     * REMARKS
     * ============================================================
     */

    doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("Remarks");

    doc.moveDown(0.5);

    doc
        .fontSize(11)
        .font("Helvetica")
        .text(
            transaction.remarks || "No remarks"
        );

    doc.moveDown(3);

    /*
     * ============================================================
     * FOOTER
     * ============================================================
     */

    doc
        .fontSize(9)
        .font("Helvetica")
        .text(
            "This is a system-generated transaction receipt.",
            {
                align: "center"
            }
        );

    doc
        .moveDown(0.3)
        .text(
            "Please keep this receipt for your records.",
            {
                align: "center"
            }
        );

    return doc;
}


/*
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

function addRow(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string
) {

    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(label, {
            continued: true,
            width: 180
        });

    doc
        .font("Helvetica")
        .text(`: ${value}`);

    doc.moveDown(0.4);
}


function maskAccount(
    accountNumber: string
): string {

    if (!accountNumber) {
        return "N/A";
    }

    if (accountNumber.length <= 4) {
        return accountNumber;
    }

    return (
        "XXXXXX" +
        accountNumber.slice(-4)
    );
}


function formatDate(
    value: Date | string
): string {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN");
}