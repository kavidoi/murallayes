#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "  Import OpenFactura Received Documents (No Auth)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "⏳ Waiting for deployment to complete (30 seconds)..."
sleep 30

echo "📥 Importing received documents from last 60 days..."
echo ""

# Calculate dates
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -v-60d +%Y-%m-%d 2>/dev/null || date -d "60 days ago" +%Y-%m-%d)

echo "📅 Date range: $START_DATE to $END_DATE"
echo ""

# Make the import request
RESPONSE=$(curl -s -X POST "https://muralla-backend.onrender.com/invoicing/received-documents/import" \
  -H "Content-Type: application/json" \
  -d "{\"startDate\": \"$START_DATE\", \"endDate\": \"$END_DATE\", \"dryRun\": false}")

# Check if response is valid JSON
if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
  echo "✅ Import completed successfully!"
  echo "═══════════════════════════════════════════════════════"
  
  # Parse and display results
  TOTAL_FETCHED=$(echo "$RESPONSE" | jq -r '.totalFetched // 0')
  TOTAL_IMPORTED=$(echo "$RESPONSE" | jq -r '.totalImported // 0')
  TOTAL_SKIPPED=$(echo "$RESPONSE" | jq -r '.totalSkipped // 0')
  ERRORS=$(echo "$RESPONSE" | jq -r '.errors | length // 0')
  
  echo "📥 Total fetched: $TOTAL_FETCHED"
  echo "✅ Total imported: $TOTAL_IMPORTED"
  echo "⏭️  Total skipped (already exist): $TOTAL_SKIPPED"
  echo "❌ Errors: $ERRORS"
  
  # Show sample of imported documents
  if [ "$TOTAL_IMPORTED" -gt 0 ]; then
    echo ""
    echo "📋 Sample of imported documents:"
    echo "$RESPONSE" | jq -r '.imported[:5][] | "  - \(.supplier): \(.type) #\(.folio) - $\(.amount)"' 2>/dev/null || true
  fi
  
  echo ""
  echo "🎉 Visit https://admin.murallacafe.cl/finance/invoicing to see the documents!"
else
  echo "❌ Import failed or deployment not ready yet"
  echo "Response: $RESPONSE"
  echo ""
  echo "⏳ Please wait a few more minutes for deployment to complete and try again."
fi
