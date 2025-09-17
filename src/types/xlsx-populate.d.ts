declare module 'xlsx-populate' {
  interface Workbook {
    outputAsync(): Promise<ArrayBuffer>;
    sheet(name: string): Worksheet;
    addSheet(name: string): Worksheet;
  }
  
  interface Worksheet {
    cell(address: string): Cell;
    range(address: string): Range;
  }
  
  interface Cell {
    value(): any;
    value(val: any): Cell;
    style(styles: any): Cell;
  }
  
  interface Range {
    value(): any[][];
    value(val: any[][]): Range;
    style(styles: any): Range;
  }
  
  const XlsxPopulate: {
    fromBlankAsync(): Promise<Workbook>;
    fromDataAsync(data: ArrayBuffer): Promise<Workbook>;
  };
  
  export = XlsxPopulate;
}
