import { useState, useEffect, type ChangeEvent } from "react";
import type { Customer, Invoice } from "./types";
import type { User } from "firebase/auth";
import { auth, db, storage } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import jsPDF from "jspdf";
import "./App.css";

export default function App() {
  // ===================== State =====================
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<Customer>({
    name: "",
    measurements: "",
    outfitName: "",
    fabric: "",
    date: "",
    images: [],
  });

  const [invoice, setInvoice] = useState<Invoice>({ amount: "", paid: false });
  const [files, setFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [login, setLogin] = useState({ email: "", password: "" });

  // Modal states
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  // ===================== Auth Listener =====================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // ===================== Firebase CRUD =====================
  const fetchCustomers = async (): Promise<void> => {
    const snap = await getDocs(collection(db, "customers"));
    setCustomers(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer))
    );
  };

  useEffect(() => {
    (async () => {
      await fetchCustomers();
    })();
  }, []);

  const loginAdmin = async (): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, login.email, login.password);
    } catch {
      alert("Login failed");
    }
  };

  const logout = async (): Promise<void> => await signOut(auth);

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `clients/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      urls.push(await getDownloadURL(storageRef));
    }
    return urls;
  };

  const saveCustomer = async (): Promise<void> => {
    const imageUrls = files.length ? await uploadImages() : form.images || [];
    const customerData: Record<string, unknown> = { ...form, images: imageUrls, invoice };

    if ("id" in form && form.id) {
      await updateDoc(doc(db, "customers", form.id), customerData);
    } else {
      await addDoc(collection(db, "customers"), customerData);
    }

    resetForm();
    await fetchCustomers();
  };

  const deleteCustomer = async (id?: string): Promise<void> => {
    if (!id) return;
    await deleteDoc(doc(db, "customers", id));
    await fetchCustomers();
  };

  const exportPDF = (c: Customer): void => {
    const pdf = new jsPDF();
    pdf.text("BEIT ADNA FASHION GALLERY", 10, 10);
    pdf.text(`Name: ${c.name}`, 10, 25);
    pdf.text(`Measurements: ${c.measurements}`, 10, 35);
    pdf.text(`Outfit: ${c.outfitName}`, 10, 45);
    pdf.text(`Fabric: ${c.fabric}`, 10, 55);
    pdf.text(
      `Invoice: ₦${c.invoice?.amount} | ${c.invoice?.paid ? "PAID" : "UNPAID"}`,
      10,
      65
    );
    pdf.save(`${c.name}.pdf`);
  };

  // ===================== Handlers =====================
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setPreviewImages(selectedFiles.map((f) => URL.createObjectURL(f)));
  };

  const resetForm = (): void => {
    setForm({ name: "", measurements: "", outfitName: "", fabric: "", date: "", images: [] });
    setFiles([]);
    setPreviewImages([]);
    setInvoice({ amount: "", paid: false });
  };

  // ===================== Image Modal Handlers =====================
  const openImageModal = (images: string[], index: number) => {
    setCurrentImages(images);
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
    setCurrentImages([]);
  };

  const showNextImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((prev) =>
      prev !== null ? (prev + 1) % currentImages.length : 0
    );
  };

  const showPrevImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((prev) =>
      prev !== null ? (prev - 1 + currentImages.length) % currentImages.length : 0
    );
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // ===================== JSX =====================
  return (
    <div className="gallery-container">
      <h1 className="gallery-title">BEIT ADNA FASHION GALLERY</h1>

      {!user ? (
        <div className="login-form">
          <input
            placeholder="Admin Email"
            value={login.email}
            onChange={(e) => setLogin({ ...login, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={login.password}
            onChange={(e) => setLogin({ ...login, password: e.target.value })}
          />
          <button onClick={loginAdmin}>Admin Login</button>
        </div>
      ) : (
        <div className="admin-dashboard">
          <h2>Admin Dashboard</h2>
          <div className="form-grid">
            <input
              placeholder="Customer Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Measurements"
              value={form.measurements}
              onChange={(e) => setForm({ ...form, measurements: e.target.value })}
            />
            <input
              placeholder="Outfit Name"
              value={form.outfitName}
              onChange={(e) => setForm({ ...form, outfitName: e.target.value })}
            />
            <input
              placeholder="Fabric"
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              placeholder="Invoice Amount"
              value={invoice.amount}
              onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })}
            />
            <label>
              Paid
              <input
                type="checkbox"
                checked={invoice.paid}
                onChange={(e) => setInvoice({ ...invoice, paid: e.target.checked })}
              />
            </label>
            <input type="file" multiple onChange={handleFileChange} />
          </div>

          {previewImages.length > 0 && (
            <div className="preview-carousel">
              {previewImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`preview ${i}`}
                  onClick={() => openImageModal(previewImages, i)}
                />
              ))}
            </div>
          )}

          <div className="dashboard-buttons">
            <button onClick={saveCustomer}>Save Client</button>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      )}

      <input
        className="search-bar"
        placeholder="Search client"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="client-grid">
        {filtered.map((c) => (
          <div key={c.id} className="client-card">
            <h3>{c.name}</h3>
            <p>{c.outfitName}</p>
            <p>
              ₦{c.invoice?.amount} • {c.invoice?.paid ? "PAID" : "UNPAID"}
            </p>
            <div className="card-carousel">
              {c.images?.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${c.name} ${i}`}
                  onClick={() => openImageModal(c.images || [], i)}
                />
              ))}
            </div>
            <div className="card-buttons">
              <button onClick={() => exportPDF(c)}>Export PDF</button>
              <button onClick={() => deleteCustomer(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div className="image-modal">
          <button className="close-btn" onClick={closeImageModal}>
            ×
          </button>
          <button className="prev-btn" onClick={showPrevImage}>
            ‹
          </button>
          <img src={currentImages[selectedImageIndex]} alt="enlarged" />
          <button className="next-btn" onClick={showNextImage}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
