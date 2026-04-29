import { setupProfiloActions, loadPianiAutomatici, loadNeedsResultsUnified, loadBIAResults, loadObiettiviData, setupBIAInputListeners, updateBadgeStatus } from "./profile-manager.js?v=14.4";
import { initWellnessTest } from "../tanita/wellness-test-controller.js?v=1.0";
import { auth, db } from "../../js/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

export function initProfile() {
onAuthStateChanged(auth, async (user) => {
if (user) {
setupProfiloActions(user.uid);
loadNeedsResultsUnified(user.uid);
loadBIAResults(user.uid);
loadObiettiviData(user.uid);
initWellnessTest();

setupBIAInputListeners();

const userDoc = await getDoc(doc(db, "users", user.uid));
if (userDoc.exists()) {
const userData = userDoc.data();
loadPianiAutomatici(userData);
updateBadgeStatus(userData);
}
}
});

const birthDateIcon = document.getElementById('birthDateIcon');
if (birthDateIcon) {
birthDateIcon.addEventListener('click', () => {
const birthDateInput = document.getElementById('birthDate');
if (birthDateInput) {
birthDateInput.focus();
birthDateInput.showPicker();
}
});
}
}
