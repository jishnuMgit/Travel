export interface MenuRow {
  fmenuid: string;
  fmenuname: string;
  fmenucaption: string;
  fmenubuttons: string;
  fuserbuttons?: string;
}

export interface MenuNode extends MenuRow {
  children: MenuNode[];
}
