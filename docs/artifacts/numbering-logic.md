# Numbering Module Flowchart

This document illustrates the logical flow for generating the next sequential number for a specific document type within the Numbering Module. This process ensures data integrity, concurrency control, and auditability.

```mermaid
flowchart TD
    start([Start: getNextDocumentNumber]) --> params[Input: documentTypeCode, externalDetails]
    params --> tx{Transaction Started?}
    tx -- No --> newTx[Start New Transaction]
    tx -- Yes --> core[Execute Core Logic]
    newTx --> core

    subgraph Logic["Core Execution Logic"]
        core --> findType[Find DocumentType by Code]
        findType --> typeExists{Type Found?}
        
        typeExists -- No --> errTypeNotFound[Throw: DocumentTypeNotFoundError]
        typeExists -- Yes --> checkEnabled{Type Enabled?}
        
        checkEnabled -- No --> errTypeDisabled[Throw: DocumentTypeDisabledError]
        checkEnabled -- Yes --> querySeries["Query Available Series\n(FOR UPDATE)"]
        
        querySeries --> filters["Filters:\n- active = true\n- validFrom <= today\n- validTo >= today OR null\n- current < end"]
        filters --> sort["Sort:\n1. isDefault DESC\n2. validFrom ASC"]
        sort --> seriesFound{Series Found?}
        
        seriesFound -- No --> errNoSeries[Throw: NoSeriesAvailableError]
        seriesFound -- Yes --> lockSeries[Lock Series Record]
        
        lockSeries --> checkCap{"Check Capacity\n(current < end)"}
        
        checkCap -- No --> errExhausted[Throw: SeriesExhaustedError]
        checkCap -- Yes --> calc[nextNumber = currentNumber + 1]
        
        calc --> update["Update Series:\ncurrentNumber = nextNumber"]
        update --> audit["Insert Audit Log:\ndocumentSequence"]
        
        audit --> format["Format Full Number:\nprefix + number + suffix"]
    end

    errTypeNotFound --> fail([End: Failure])
    errTypeDisabled --> fail
    errNoSeries --> fail
    errExhausted --> fail
    
    format --> success(["End: Return Result\n{seriesId, assignedNumber, fullNumber}"])
    
    style start fill:#f9f,stroke:#333
    style fail fill:#fdd,stroke:#333
    style success fill:#dfd,stroke:#333
    style Logic fill:#f5faff,stroke:#3b82f6
```

## Description
The flowchart above details the `getNextDocumentNumber` process defined in `svc/numbering/getNextDocumentNumber.ts`. It handles:
1.  **Validation**: Verifies the document type is valid and enabled.
2.  **Concurrency**: Uses database transactions and row locking (`FOR UPDATE`) to prevent race conditions when multiple users request a number simultaneously.
3.  **Series Selection**: Automatically picks the best series based on validity dates and priority (default series first).
4.  **Auditing**: Every assigned number is logged in the `documentSequence` table to link the number to the external business document (Order, Invoice, etc.).
