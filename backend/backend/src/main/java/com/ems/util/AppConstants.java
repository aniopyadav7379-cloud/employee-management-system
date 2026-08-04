package com.ems.util;

public final class AppConstants {

    private AppConstants() {}

    // Pagination defaults
    public static final int    DEFAULT_PAGE_NUMBER   = 0;
    public static final int    DEFAULT_PAGE_SIZE      = 10;
    public static final int    MAX_PAGE_SIZE          = 100;
    public static final String DEFAULT_SORT_BY        = "createdAt";
    public static final String DEFAULT_SORT_DIR       = "desc";

    // Leave balance defaults (days per year)
    public static final int CASUAL_LEAVE_QUOTA     = 10;
    public static final int SICK_LEAVE_QUOTA       = 10;
    public static final int ANNUAL_LEAVE_QUOTA     = 20;
    public static final int MATERNITY_LEAVE_QUOTA  = 180;
    public static final int PATERNITY_LEAVE_QUOTA  = 15;
    public static final int UNPAID_LEAVE_QUOTA     = 30;

    // Employee ID prefix
    public static final String EMPLOYEE_ID_PREFIX   = "EMS-";

    // Date formats
    public static final String DATE_FORMAT          = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT      = "yyyy-MM-dd'T'HH:mm:ss";

    // Error messages
    public static final String EMPLOYEE_NOT_FOUND   = "Employee not found with id: ";
    public static final String DEPARTMENT_NOT_FOUND = "Department not found with id: ";
    public static final String LEAVE_NOT_FOUND      = "Leave request not found with id: ";
    public static final String USER_NOT_FOUND       = "User not found with email: ";
}
