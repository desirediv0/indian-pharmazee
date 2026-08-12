<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap | Indian Pharmazee</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
          body { background-color: #0f172a; color: #f8fafc; padding: 40px 20px; line-height: 1.6; }
          .container { max-width: 1200px; margin: 0 auto; background: #1e293b; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #334155; }
          .header { background: linear-gradient(135deg, #0d9488 0%, #059669 100%); color: #ffffff; padding: 36px 40px; }
          .header h1 { font-size: 30px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.02em; }
          .header p { opacity: 0.95; font-size: 14px; font-weight: 400; }
          .stats-bar { display: flex; align-items: center; justify-content: space-between; padding: 18px 40px; background: #0f172a; border-bottom: 1px solid #334155; font-size: 14px; font-weight: 500; color: #94a3b8; }
          .stat-badge { background: #10b981; color: #064e3b; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-left: 6px; }
          .table-container { padding: 20px 40px 40px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
          th { padding: 14px 16px; background: #1e293b; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; border-bottom: 2px solid #334155; }
          td { padding: 14px 16px; border-bottom: 1px solid #334155; color: #cbd5e1; word-break: break-all; }
          tr:hover td { background-color: #334155; }
          a { color: #38bdf8; text-decoration: none; font-weight: 500; transition: color 0.2s; }
          a:hover { text-decoration: underline; color: #7dd3fc; }
          .priority { font-weight: 700; color: #34d399; }
          .freq { text-transform: capitalize; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Indian Pharmazee — XML Sitemap</h1>
            <p>Dynamic Search Engine Indexing Sitemap — Specialty Medicines &amp; Healthcare Products</p>
          </div>
          <div class="stats-bar">
            <div>Total Indexed URLs: <span class="stat-badge"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span></div>
            <div style="font-size: 12px; color: #64748b;">Format: Standard XML Sitemaps Protocol 0.9</div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 55%;">Page URL</th>
                  <th style="width: 15%;">Priority</th>
                  <th style="width: 15%;">Change Frequency</th>
                  <th style="width: 15%;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <xsl:variable name="itemURL">
                        <xsl:value-of select="sitemap:loc"/>
                      </xsl:variable>
                      <a href="{$itemURL}" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td class="priority">
                      <xsl:value-of select="sitemap:priority"/>
                    </td>
                    <td class="freq">
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                    <td style="color: #94a3b8;">
                      <xsl:value-of select="concat(substring(sitemap:lastmod,0,11), ' ', substring(sitemap:lastmod,12,5))"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
