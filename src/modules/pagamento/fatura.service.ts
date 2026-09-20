import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'
import { PagamentoService } from './pagamento.service'

export const FaturaService = {
  async gerarPdf(id: string, empresaId?: string): Promise<{ nomeFicheiro: string; stream: PassThrough }> {
    const pagamento = await PagamentoService.buscarPorId(id, empresaId)

    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = new PassThrough()
    doc.pipe(stream)

    doc.fontSize(20).text('Kituxi Tech', { align: 'left' })
    doc.fontSize(10).fillColor('#666').text('Fatura / comprovativo de pagamento')
    doc.moveDown(2)

    doc.fillColor('#000').fontSize(14).text(`Fatura — ${pagamento.empresa.nome}`)
    doc.moveDown()

    doc.fontSize(11)
    doc.text(`Referência: ${pagamento.referencia ?? '-'}`)
    doc.text(`Plano / licença: ${pagamento.licenca.plano}`)
    doc.text(`Valor: AOA ${pagamento.valor.toLocaleString('pt-PT')}`)
    doc.text(`Status: ${pagamento.status}`)
    doc.text(`Data: ${new Date(pagamento.criadoEm).toLocaleDateString('pt-PT')}`)
    doc.moveDown(2)

    doc.fontSize(9).fillColor('#999').text('Documento gerado automaticamente pela plataforma VAR.', { align: 'center' })

    doc.end()

    const nomeFicheiro = `fatura_${pagamento.referencia ?? pagamento.id.slice(0, 8)}.pdf`
    return { nomeFicheiro, stream }
  },
}
