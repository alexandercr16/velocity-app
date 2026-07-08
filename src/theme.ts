// Design tokens ported 1:1 from the Velocity.dc.html prototype's --custom-properties.
export const colors = {
  ink: "#191B20",
  sub: "#6E727B",
  faint: "#AEB2B9",
  line: "#ECEDF0",
  screen: "#FFFFFF",
  wash: "#F5F6F8",
  accent: "#4B4EDB",
  accentInk: "#3B3EB8",
  accentWash: "#EEEFFB",
  pivot: "#E2623C",
  desk: "#E7E9EC",
};

export const fonts = {
  ui: "HankenGrotesk_400Regular",
  uiMedium: "HankenGrotesk_500Medium",
  uiSemibold: "HankenGrotesk_600SemiBold",
  uiBold: "HankenGrotesk_700Bold",
  read: "Newsreader_500Medium",
  readItalic: "Newsreader_500Medium_Italic",
  readBody: "Newsreader_400Regular",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
};

export const radii = {
  sm: 10,
  md: 13,
  lg: 15,
  xl: 18,
};

export type Theme = typeof colors;
