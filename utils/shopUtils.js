import { doc, updateDoc, arrayUnion, collection, where, getDocs, query } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Alert } from "react-native";
import { Customer, Shop } from "../types";

export const joinShopByQR = async (shopLink, customerUid) => {
  try {
    const q = query(collection(db, "shops"), where("link", "==", shopLink));

    const shopSnap = await getDocs(q);

    if (shopSnap.empty) {
      return {
        success: false,
        message: "Shop not found. Please check the link and try again.",
      };
    }

    const shopDoc = shopSnap.docs[0];
    const shopData = shopDoc.data();
    
    // Check if customer is already joined
    if (shopData.customers && shopData.customers.includes(customerUid)) {
      return {
        success: false,
        message: "You are already a member of this shop.",
      };
    }

    const shopRef = shopDoc.ref;
    // Add customer to shop's customers array
    await updateDoc(shopRef, {
      customers: arrayUnion(customerUid),
    });

    // Add shop to customer's shopsJoined array
    const customerRef = doc(db, "customers", customerUid);
    await updateDoc(customerRef, {
      shopsJoined: arrayUnion(shopDoc.id),
    });

    return {
      success: true,
      message: `Successfully joined ${shopData.name || "the shop"}!`,
      shopData,
    };
  } catch (error) {
    console.error("Error joining shop:", error);
    return {
      success: false,
      message: "An error occurred while joining the shop. Please try again.",
    };
  }
};

/**
 * Shows an alert with join result
 * @param {object} result - Result from joinShopByLink
 * @param {function} onSuccess - Callback for successful join
 */
export const handleJoinResult = (result, onSuccess = null) => {
  if (result.success) {
    Alert.alert("Success!", result.message, [
      {
        text: "OK",
        onPress: onSuccess,
      },
    ]);
  } else {
    Alert.alert("Error", result.message);
  }
};
