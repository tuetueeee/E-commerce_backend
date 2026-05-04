import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfig {
  private static firebaseAppInstance: admin.app.App | null = null;
  private static firestoreInstance: admin.firestore.Firestore | null = null;
  private static firestoreConfigured = false;

  private firebaseApp: admin.app.App;
  public db: admin.firestore.Firestore;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (FirebaseConfig.firebaseAppInstance) {
        this.firebaseApp = FirebaseConfig.firebaseAppInstance;
      } else {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          clientId: process.env.FIREBASE_CLIENT_ID,
          authUri: process.env.FIREBASE_AUTH_URI,
          tokenUri: process.env.FIREBASE_TOKEN_URI,
          authProviderX509CertUrl:
            process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
          clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        };

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as any),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        FirebaseConfig.firebaseAppInstance = this.firebaseApp;
      }

      if (FirebaseConfig.firestoreInstance) {
        this.db = FirebaseConfig.firestoreInstance;
      } else {
        this.db = admin.firestore(this.firebaseApp);
        FirebaseConfig.firestoreInstance = this.db;
      }

      if (!FirebaseConfig.firestoreConfigured) {
        this.db.settings({
          ignoreUndefinedProperties: true,
        });
        FirebaseConfig.firestoreConfigured = true;
      }

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  getFirestore(): admin.firestore.Firestore {
    return this.db;
  }

  getAuth(): admin.auth.Auth {
    return admin.auth(this.firebaseApp);
  }
}
