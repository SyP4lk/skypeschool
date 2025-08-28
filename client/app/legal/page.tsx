"use client";

import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import styles from "../Home.module.css";

export default function LegalPage() {
  return (
    <section className={styles.section}>
      <div className="container">
        <h1 className={styles.sectionTitle}>Правовая информация</h1>
        <p className={styles.sectionSubtitle}>
          Ниже размещены действующие редакции правовых документов SkypeSchool.
          Для печати и скачивания используйте ссылки под просмотром документа.
        </p>

        <Tabs aria-label="Правовые документы" className="mt-6" variant="solid">
          <Tab key="agreement" title="Пользовательское соглашение">
            <Card>
              <CardBody>
                <div className="w-full aspect-[1/1.414] max-h-[80vh]">
                  <object
                    data="/legal/polzovatelskoe-soglashenie-shablon.pdf#view=FitH"
                    type="application/pdf"
                    className="w-full h-[80vh]"
                  >
                    <p>
                      Ваш браузер не поддерживает PDF-просмотр.{" "}
                      <a href="/legal/polzovatelskoe-soglashenie-shablon.pdf" download>
                        Скачать PDF
                      </a>
                    </p>
                  </object>
                </div>
                <div className="mt-3 text-sm opacity-80">
                  <a href="/legal/polzovatelskoe-soglashenie-shablon.pdf" download>
                    Скачать «Пользовательское соглашение» (PDF)
                  </a>
                </div>
              </CardBody>
            </Card>
          </Tab>

          <Tab key="offer" title="Публичная оферта">
            <Card>
              <CardBody>
                <div className="w-full aspect-[1/1.414] max-h-[80vh]">
                  <object
                    data="/legal/publichnaya-oferta-internet-servisa.pdf#view=FitH"
                    type="application/pdf"
                    className="w-full h-[80vh]"
                  >
                    <p>
                      Ваш браузер не поддерживает PDF-просмотр.{" "}
                      <a href="/legal/publichnaya-oferta-internet-servisa.pdf" download>
                        Скачать PDF
                      </a>
                    </p>
                  </object>
                </div>
                <div className="mt-3 text-sm opacity-80">
                  <a href="/legal/publichnaya-oferta-internet-servisa.pdf" download>
                    Скачать «Публичную оферту» (PDF)
                  </a>
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>

        <div className="mt-6 text-xs opacity-70">
          Примечание: шаблоны содержат переменные (например, «[название владельца сайта]»).
          Перед публикацией замените их на фактические данные компании.
        </div>
      </div>
    </section>
  );
}
