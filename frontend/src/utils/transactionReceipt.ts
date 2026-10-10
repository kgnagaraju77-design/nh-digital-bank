import jsPDF from "jspdf";

interface ReceiptTransaction {
  id: number;
  transaction_reference: string;
  receiver_account_number: string;
  sender_account_number: string;
  amount: string | number;
  transaction_type: string;
  status: string;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  beneficiary_name?: string;
}

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

function maskAccount(accountNumber?: string): string {
  if (!accountNumber) {
    return "XXXX XXXX";
  }

  const account = String(accountNumber).replace(/\D/g, "");

  if (account.length <= 4) {
    return `XXXX ${account}`;
  }

  return `XXXX XXXX ${account.slice(-4)}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTransactionType(value: string): string {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAmount(value: string | number): string {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "0.00";
  }

  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusLabel(status?: string): string {
  return String(status || "UNKNOWN").toUpperCase();
}

/*
|--------------------------------------------------------------------------
| Main Receipt Generator
|--------------------------------------------------------------------------
*/

export function downloadTransactionReceipt(
  transaction: ReceiptTransaction
): void {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  /*
  |--------------------------------------------------------------------------
  | Color Palette
  |--------------------------------------------------------------------------
  */

  const primary = {
    r: 25,
    g: 55,
    b: 95,
  };

  const primaryDark = {
    r: 17,
    g: 42,
    b: 76,
  };

  const success = {
    r: 31,
    g: 132,
    b: 86,
  };

  const successLight = {
    r: 232,
    g: 247,
    b: 239,
  };

  const textDark = {
    r: 30,
    g: 41,
    b: 59,
  };

  const textMuted = {
    r: 100,
    g: 116,
    b: 139,
  };

  const border = {
    r: 218,
    g: 225,
    b: 234,
  };

  const lightBackground = {
    r: 247,
    g: 249,
    b: 252,
  };

  /*
  |--------------------------------------------------------------------------
  | Transaction Values
  |--------------------------------------------------------------------------
  */

  const status = getStatusLabel(transaction.status);

  const transactionType = formatTransactionType(
    transaction.transaction_type
  );

  const amount = formatAmount(transaction.amount);

  /*
  |--------------------------------------------------------------------------
  | PAGE BACKGROUND
  |--------------------------------------------------------------------------
  */

  pdf.setFillColor(250, 251, 253);

  pdf.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  );

  /*
  |--------------------------------------------------------------------------
  | MAIN WHITE RECEIPT CONTAINER
  |--------------------------------------------------------------------------
  */

  pdf.setFillColor(255, 255, 255);

  pdf.roundedRect(
    10,
    10,
    pageWidth - 20,
    pageHeight - 20,
    4,
    4,
    "F"
  );

  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  // NH logo circle

  pdf.setFillColor(
    primary.r,
    primary.g,
    primary.b
  );

  pdf.circle(
    margin + 6,
    25,
    6,
    "F"
  );

  pdf.setTextColor(255, 255, 255);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  pdf.text(
    "NH",
    margin + 6,
    27.2,
    {
      align: "center",
    }
  );

  // Bank name

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);

  pdf.text(
    "NH DIGITAL BANK",
    margin + 15,
    24
  );

  // Tagline

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);

  pdf.text(
    "Secure. Simple. Smart.",
    margin + 15,
    30
  );

  // Right side label

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  pdf.text(
    "DIGITAL TRANSACTION RECEIPT",
    pageWidth - margin,
    23,
    {
      align: "right",
    }
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);

  pdf.text(
    "Generated electronically",
    pageWidth - margin,
    29,
    {
      align: "right",
    }
  );

  // Header line

  pdf.setDrawColor(
    border.r,
    border.g,
    border.b
  );

  pdf.setLineWidth(0.35);

  pdf.line(
    margin,
    38,
    pageWidth - margin,
    38
  );

  /*
  |--------------------------------------------------------------------------
  | TITLE + STATUS
  |--------------------------------------------------------------------------
  */

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);

  pdf.text(
    "TRANSACTION RECEIPT",
    margin,
    51
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS BADGE
  |--------------------------------------------------------------------------
  */

  const badgeWidth = 34;
  const badgeHeight = 10;

  const badgeX =
    pageWidth - margin - badgeWidth;

  const badgeY = 44;

  if (status === "SUCCESS") {
    pdf.setFillColor(
      successLight.r,
      successLight.g,
      successLight.b
    );

    pdf.setTextColor(
      success.r,
      success.g,
      success.b
    );
  } else {
    pdf.setFillColor(243, 244, 246);

    pdf.setTextColor(
      textDark.r,
      textDark.g,
      textDark.b
    );
  }

  pdf.roundedRect(
    badgeX,
    badgeY,
    badgeWidth,
    badgeHeight,
    3,
    3,
    "F"
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  pdf.text(
    status,
    badgeX + badgeWidth / 2,
    badgeY + 6.5,
    {
      align: "center",
    }
  );

  /*
  |--------------------------------------------------------------------------
  | AMOUNT CARD
  |--------------------------------------------------------------------------
  */

  const amountY = 62;
  const amountHeight = 45;

  pdf.setFillColor(
    lightBackground.r,
    lightBackground.g,
    lightBackground.b
  );

  pdf.roundedRect(
    margin,
    amountY,
    contentWidth,
    amountHeight,
    4,
    4,
    "F"
  );

  // Label

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  pdf.text(
    "TRANSFER AMOUNT",
    pageWidth / 2,
    amountY + 11,
    {
      align: "center",
    }
  );

  // Amount

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(25);

  pdf.text(
    `INR ${amount}`,
    pageWidth / 2,
    amountY + 27,
    {
      align: "center",
    }
  );

  // Type

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);

  pdf.text(
    transactionType,
    pageWidth / 2,
    amountY + 37,
    {
      align: "center",
    }
  );

  /*
  |--------------------------------------------------------------------------
  | REFERENCE BLOCK
  |--------------------------------------------------------------------------
  */

  let y = 121;

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);

  pdf.text(
    "REFERENCE NUMBER",
    margin,
    y
  );

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);

  pdf.text(
    transaction.transaction_reference,
    margin,
    y + 7
  );

  /*
  |--------------------------------------------------------------------------
  | TRANSFER SUMMARY HEADER
  |--------------------------------------------------------------------------
  */

  y = 143;

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);

  pdf.text(
    "TRANSFER SUMMARY",
    margin,
    y
  );

  pdf.setDrawColor(
    border.r,
    border.g,
    border.b
  );

  pdf.setLineWidth(0.3);

  pdf.line(
    margin,
    y + 5,
    pageWidth - margin,
    y + 5
  );

  /*
  |--------------------------------------------------------------------------
  | FROM / TO CARDS
  |--------------------------------------------------------------------------
  */

  const transferCardY = y + 13;
  const cardGap = 8;
  const cardWidth =
    (contentWidth - cardGap) / 2;

  // FROM CARD

  pdf.setFillColor(
    249,
    250,
    252
  );

  pdf.roundedRect(
    margin,
    transferCardY,
    cardWidth,
    37,
    3,
    3,
    "F"
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);

  pdf.text(
    "FROM",
    margin + 7,
    transferCardY + 9
  );

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);

  pdf.text(
    "Primary Account",
    margin + 7,
    transferCardY + 18
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);

  pdf.text(
    maskAccount(
      transaction.sender_account_number
    ),
    margin + 7,
    transferCardY + 27
  );

  // TO CARD

  const toCardX =
    margin + cardWidth + cardGap;

  pdf.setFillColor(
    249,
    250,
    252
  );

  pdf.roundedRect(
    toCardX,
    transferCardY,
    cardWidth,
    37,
    3,
    3,
    "F"
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);

  pdf.text(
    "TO",
    toCardX + 7,
    transferCardY + 9
  );

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);

  pdf.text(
    transaction.beneficiary_name ||
      "Beneficiary",
    toCardX + 7,
    transferCardY + 18
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);

  pdf.text(
    maskAccount(
      transaction.receiver_account_number
    ),
    toCardX + 7,
    transferCardY + 27
  );

  /*
  |--------------------------------------------------------------------------
  | TRANSACTION INFORMATION
  |--------------------------------------------------------------------------
  */

  y = 203;

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);

  pdf.text(
    "TRANSACTION INFORMATION",
    margin,
    y
  );

  pdf.setDrawColor(
    border.r,
    border.g,
    border.b
  );

  pdf.line(
    margin,
    y + 5,
    pageWidth - margin,
    y + 5
  );

  const leftColumn = margin;
  const rightColumn =
    pageWidth / 2 + 5;

  y += 17;

  /*
  |--------------------------------------------------------------------------
  | ROW 1
  |--------------------------------------------------------------------------
  */

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);

  pdf.text(
    "TRANSACTION ID",
    leftColumn,
    y
  );

  pdf.text(
    "TRANSACTION TYPE",
    rightColumn,
    y
  );

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);

  pdf.text(
    String(transaction.id),
    leftColumn,
    y + 7
  );

  pdf.text(
    transactionType,
    rightColumn,
    y + 7
  );

  /*
  |--------------------------------------------------------------------------
  | ROW 2
  |--------------------------------------------------------------------------
  */

  y += 19;

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);

  pdf.text(
    "TRANSACTION DATE",
    leftColumn,
    y
  );

  pdf.text(
    "LAST UPDATED",
    rightColumn,
    y
  );

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);

  pdf.text(
    formatDate(transaction.created_at),
    leftColumn,
    y + 7
  );

  pdf.text(
    formatDate(transaction.updated_at),
    rightColumn,
    y + 7
  );

  /*
  |--------------------------------------------------------------------------
  | ROW 3 - REMARKS
  |--------------------------------------------------------------------------
  */

  y += 19;

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);

  pdf.text(
    "REMARKS",
    leftColumn,
    y
  );

  pdf.setTextColor(
    textDark.r,
    textDark.g,
    textDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);

  pdf.text(
    transaction.remarks || "-",
    leftColumn,
    y + 7
  );

  /*
  |--------------------------------------------------------------------------
  | SECURITY NOTICE
  |--------------------------------------------------------------------------
  */

  const securityY = 261;

  pdf.setFillColor(
    247,
    249,
    252
  );

  pdf.roundedRect(
    margin,
    securityY,
    contentWidth,
    20,
    3,
    3,
    "F"
  );

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  pdf.text(
    "SECURITY",
    margin + 7,
    securityY + 8
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);

  pdf.text(
    "This transaction was securely processed by NH Digital Bank.",
    margin + 7,
    securityY + 14
  );

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  const footerLineY =
    pageHeight - 17;

  pdf.setDrawColor(
    border.r,
    border.g,
    border.b
  );

  pdf.setLineWidth(0.3);

  pdf.line(
    margin,
    footerLineY,
    pageWidth - margin,
    footerLineY
  );

  pdf.setTextColor(
    textMuted.r,
    textMuted.g,
    textMuted.b
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);

  pdf.text(
    "This is a computer-generated receipt and does not require a signature.",
    pageWidth / 2,
    footerLineY + 6,
    {
      align: "center",
    }
  );

  pdf.setTextColor(
    primaryDark.r,
    primaryDark.g,
    primaryDark.b
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);

  pdf.text(
    "NH Digital Bank - Secure. Simple. Smart.",
    pageWidth / 2,
    footerLineY + 11,
    {
      align: "center",
    }
  );

  /*
  |--------------------------------------------------------------------------
  | DOWNLOAD FILE
  |--------------------------------------------------------------------------
  */

  const safeReference =
    transaction.transaction_reference.replace(
      /[^a-zA-Z0-9-_]/g,
      ""
    );

  pdf.save(
    `NH-Digital-Bank-Receipt-${safeReference}.pdf`
  );
}