# -*- coding: utf-8 -*-
"""Match target keywords to section-scoped guide text. Run: python analyze_calculator_keywords.py"""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parent

# Section split: title uses Title Case; body uses lowercase phrases — split on exact title anchors.
MARKERS = [
    "Home Loan EMI Calculator",
    "Car Loan EMI Calculator",
    "Personal Loan EMI Calculator",
    "Education Loan EMI Calculator",
]


def load_full_text() -> str:
    p = BASE / "calculator_guides.txt"
    if not p.exists():
        raise SystemExit(f"Missing {p.name} — place the five guides in that file (UTF-8).")
    return p.read_text(encoding="utf-8", errors="replace")


def split_sections(full: str) -> dict[str, str]:
    positions = [(m, full.find(m)) for m in MARKERS]
    for m, pos in positions:
        if pos < 0:
            raise SystemExit(f"Marker not found: {m!r}")
    # EMI = start through first marker
    i0 = positions[0][1]
    sections = {
        "EMI Calculator": full[:i0],
        "Home Loan EMI Calculator": full[positions[0][1] : positions[1][1]],
        "Car Loan EMI Calculator": full[positions[1][1] : positions[2][1]],
        "Personal Loan EMI Calculator": full[positions[2][1] : positions[3][1]],
        "Education Loan EMI Calculator": full[positions[3][1] :],
    }
    return sections


def normalize(s: str) -> str:
    return s.casefold()


def unique_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        k = x.strip()
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(k)
    return out


KEYWORDS_RAW: dict[str, list[str]] = {
    "EMI Calculator": """emi calculator
loan calculator
loan emi calculator
loan interest calculator
emi calculator online
monthly emi calculator
emi calculator app
emi interest calculator
bank loan interest calculator
online loan calculator
bank loan calculator
loan amount calculator
bank emi calculator
bank calculator
emi interest rate calculator
installment calculator
loan percentage calculator
loan interest rate calculator
term loan emi calculator
easy emi calculator
bank loan emi calculator
loan emi calculator online
loan repayment calculator
emi schedule calculator
installment loan calculator
best emi calculator
how to calculate emi
loan emi calculator app
finance emi calculator
emi converter
emi repayment calculator
calculate loan amount from emi
loan emi calculator monthly
emi calculator formula
emi principal and interest calculator
emi calculator per month
emi percentage calculator
monthly loan calculator
how to calculate interest on a loan
loan interest calculator online
6 month emi calculator
half yearly emi calculator
emi formula
yearly emi calculator
emi and interest calculator
emi calculator formula
emi monthly interest calculator
emi amount calculator
how to calculate loan emi
loan calculator formula
monthly installment calculator
emi table
emi payment calculator
check emi calculator
emi repayment schedule
finance interest calculator
principal and interest loan calculator
loan rate calculator
emi loan calculator online
easy emi loan calculator
calculate monthly interest on loan
calculate my emi
loan calculator per month
loan and emi calculator
simple loan calculator
detailed emi calculator
bank emi interest calculator
emi calculation calculator
loan premium calculator
emi calculator tool""".splitlines(),
    "Home Loan EMI Calculator": """home loan emi calculator
home loan calculator
housing loan emi calculator
home emi calculator
home loan interest calculator
house loan calculator
house loan emi
how to calculate home loan emi
bank housing loan calculator
house emi calculator
house loan calculator online
home loan emi calculator online
bank home loan calculator
home loan monthly payment calculator
bank emi calculator for home loan
housing loan interest rate calculator
home loan rate calculator
how to calculate emi for housing loan
home loan formula
home loan emi calculator formula
home loan interest emi calculator
how to calculate home loan
home loan amount calculator
how home loan is calculated
home loan emi calculator formula
how to calculate house loan
house finance calculator""".splitlines(),
    "Car Loan EMI Calculator": """car loan emi calculator
car emi calculator
car loan calculator
car loan interest calculator
car loan interest rate
car loan emi
car loan interest rate calculator
vehicle loan emi calculator
vehicle loan calculator
car finance calculator
used car loan emi calculator
vehicle emi calculator
second hand car loan emi calculator
auto loan emi calculator
car emi calculator online
vehicle loan interest calculator
car loan repayment calculator
new car emi calculator
used car loan calculator
used car emi calculator
auto loan calculator
car installment calculator
new car loan emi calculator
car payment calculator
four wheeler emi calculator
car loan emi calculator online
refinance car loan calculator
car interest rate calculator
online car loan calculator
new car loan calculator
auto emi calculator
vehicle loan emi
how to calculate car loan emi
vehicle finance calculator
car loan installment calculator
4 wheeler loan calculator
auto loan amortization calculator
four wheeler loan emi calculator
car loan finance calculator
how to calculate car loan interest
how to calculate car loan emi
how to calculate car loan interest
auto loan amount calculator
car loan amount calculator
emi calculation formula car loan
vehicle interest calculator
commercial vehicle loan emi calculator
commercial vehicle loan calculator
how to calculate emi for car
bank car loan interest rates""".splitlines(),
    "Personal Loan EMI Calculator": """personal loan emi calculator
personal loan calculator
pl calculator
pl emi calculator
personal loan emi
pl loan calculator
personal emi calculator
personal loan interest calculator
personal loan interest
personal loan emi calculator online
online personal loan emi calculator
personal loan interest
pl interest calculator
online personal loan calculator
bank personal loan emi calculator
personal loan emi calculator month wise
how to calculate emi for personal loan
how to calculate personal loan interest
personal loan amount calculator
how to calculate emi for personal loan
bank personal loan calculator
personal loan monthly emi calculator
personal loan calculator with amortization schedule
personal loan emi interest rates
personal loan emi calculator formula""".splitlines(),
    "Education Loan EMI Calculator": """education loan emi calculator
student loan emi calculator
education loan calculator
student loan calculator
education loan interest rate calculator
education loan interest calculator
education loan repayment calculator
student loan repayment calculator
education loan emi
study loan calculator
student loan interest calculator
study loan emi calculator
abroad education loan emi calculator
student loan interest rate calculator
education emi calculator
education loan tenure
how to calculate education loan interest
how much interest on education loan
how much is student loan interest
education loan tenure""".splitlines(),
}


def analyze(section_name: str, text: str, keywords: list[str]) -> tuple[int, int, list[str], list[str]]:
    kws = unique_preserve_order([k for k in keywords if k.strip()])
    hay = normalize(text)
    found: list[str] = []
    missing: list[str] = []
    for kw in kws:
        if normalize(kw) in hay:
            found.append(kw)
        else:
            missing.append(kw)
    return len(found), len(kws), found, missing


def main() -> None:
    full = load_full_text()
    # Strip trailing keyword appendix if user pasted it into same file
    cut = full.find("this is text content")
    if cut != -1:
        full = full[:cut]
    sections = split_sections(full)

    print("Keyword coverage (case-insensitive exact phrase / substring match)\n")
    grand_f, grand_t = 0, 0
    for name in [
        "EMI Calculator",
        "Home Loan EMI Calculator",
        "Car Loan EMI Calculator",
        "Personal Loan EMI Calculator",
        "Education Loan EMI Calculator",
    ]:
        raw = KEYWORDS_RAW[name]
        f, t, _, missing = analyze(name, sections[name], raw)
        grand_f += f
        grand_t += t
        pct = (100.0 * f / t) if t else 0.0
        print(f"## {name}")
        print(f"Found: {f} / {t} unique keywords  →  {pct:.1f}%")
        if missing:
            print("Missing:")
            for m in missing:
                print(f"  - {m}")
        print()

    gpct = (100.0 * grand_f / grand_t) if grand_t else 0.0
    print(f"## ALL SECTIONS (combined)")
    print(f"Found: {grand_f} / {grand_t}  →  {gpct:.1f}%")


if __name__ == "__main__":
    main()
