output "resource_group_location" {
  value = azurerm_resource_group.agape_app_rg.location
}

output "resource_group_name" {
  value = azurerm_resource_group.agape_app_rg.name
}

output "storage_account_name" {
  value = azurerm_storage_account.agape_app_storage.name
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.agape_app_storage.primary_blob_endpoint
}

output "connection_string" {
  value     = azurerm_storage_account.agape_app_storage.primary_connection_string
  sensitive = true
}

output "persistent_data_disk_id" {
  value = azurerm_managed_disk.persistent_data_disk.id
}
