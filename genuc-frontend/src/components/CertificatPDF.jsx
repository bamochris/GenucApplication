// src/components/CertificatPDF.jsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  border: {
    border: '2px solid #0B1F4A',
    padding: 30,
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#212529',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#185FA5',
    marginBottom: 20,
    letterSpacing: 1,
  },
  line: {
    borderBottom: '2px solid #185FA5',
    width: '60%',
    marginHorizontal: 'auto',
    marginBottom: 20,
  },
  content: {
    marginTop: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginVertical: 12,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 12,
    color: '#444444',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#185FA5',
    marginVertical: 8,
  },
  date: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 10,
  },
});

const CertificatPDF = ({ nomComplet, coursTitre, code, date, mention }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.border}>
        <Text style={styles.title}>GENUC</Text>
        <Text style={styles.subtitle}>Académie Intégrale du Congo</Text>
        <View style={styles.line} />

        <View style={styles.content}>
          <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>CERTIFICAT DE RÉUSSITE</Text>
          <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 16 }}>Délivré à</Text>

          <Text style={styles.name}>{nomComplet}</Text>

          <Text style={styles.text}>a suivi avec succès le cours</Text>
          <Text style={styles.courseName}>{coursTitre}</Text>
          <Text style={styles.text}>(Code: {code})</Text>

          <View style={{ marginVertical: 12, paddingHorizontal: 20 }}>
            <Text style={styles.text}>
              Cette attestation certifie que l'étudiant(e) a validé l'ensemble des modules du cours
              et démontré une maîtrise satisfaisante des compétences enseignées.
            </Text>
          </View>

          {mention && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f4ff', borderRadius: 4 }}>
              <Text style={{ fontSize: 12, color: '#185FA5' }}>
                Mention obtenue : <Text style={{ fontWeight: 'bold' }}>{mention}</Text>
              </Text>
            </View>
          )}

          <Text style={styles.date}>Délivré le {date}</Text>
        </View>

        <View style={styles.footer}>
          <Text>GENUC — Plateforme nationale de gestion universitaire</Text>
          <Text>Vérifiable sur https://genuc.cd/verifier</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default CertificatPDF;