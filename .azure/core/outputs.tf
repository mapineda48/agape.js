output "storage_account_name" {
  value = azurerm_storage_account.storage.name
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.storage.primary_blob_endpoint
}

output "connection_string" {
  value     = azurerm_storage_account.storage.primary_connection_string
  sensitive = true
}
