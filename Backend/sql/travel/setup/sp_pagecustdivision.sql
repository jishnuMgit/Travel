CREATE OR REPLACE PROCEDURE dbo.sp_pagecustdivision(
    IN p_strmode character varying,
    IN p_gstrcoid character varying,
    IN p_strcustomerid character varying,
    IN p_strdivid character varying,
    IN p_strdivname character varying,
    IN p_strdivname_a character varying,
    IN p_gstruserid character varying,
    OUT p_result jsonb
)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_mode text := UPPER(TRIM(p_strmode));
    v_row_count integer;
BEGIN
    p_result := NULL;

    IF v_mode = 'G' THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
        INTO p_result
        FROM (
            SELECT
                fcustomerid,
                fdivid,
                fdivname,
                fdivname_ar
            FROM dbo.tblcustdivision
            WHERE fcoid = p_gstrcoid
              AND fcustomerid = p_strcustomerid
            ORDER BY fdivid
        ) x;

    ELSIF v_mode = 'S' THEN
        INSERT INTO dbo.tblcustdivision
        (
            fcoid,
            fcustomerid,
            fdivid,
            fdivname,
            fdivname_ar,
            fcuserid,
            fcuserdate
        )
        VALUES
        (
            p_gstrcoid,
            p_strcustomerid,
            p_strdivid,
            p_strdivname,
            p_strdivname_a,
            p_gstruserid,
            CURRENT_TIMESTAMP
        );

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'inserted_count', v_row_count,
            'message', 'Customer division inserted successfully'
        );

    ELSIF v_mode = 'M' THEN
        UPDATE dbo.tblcustdivision
        SET
            fdivid = p_strdivid,
            fdivname = p_strdivname,
            fdivname_ar = p_strdivname_a,
            fmuserid = p_gstruserid,
            fmuserdate = CURRENT_TIMESTAMP
        WHERE fcoid = p_gstrcoid
          AND fcustomerid = p_strcustomerid
          AND fdivid = p_strdivid;

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'updated_count', v_row_count,
            'message',
            CASE WHEN v_row_count > 0
                THEN 'Customer division updated successfully'
                ELSE 'No matching customer division found'
            END
        );

    ELSIF v_mode = 'C' THEN
        DELETE FROM dbo.tblcustdivision
        WHERE fcoid = p_gstrcoid
          AND fcustomerid = p_strcustomerid;

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'deleted_count', v_row_count,
            'message',
            CASE WHEN v_row_count > 0
                THEN 'Customer division deleted successfully'
                ELSE 'No matching customer division found'
            END
        );

    ELSIF v_mode = 'D' THEN
        DELETE FROM dbo.tblcustdivision
        WHERE fcoid = p_gstrcoid
          AND fcustomerid = p_strcustomerid
          AND fdivid = p_strdivid;

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'deleted_count', v_row_count,
            'message',
            CASE WHEN v_row_count > 0
                THEN 'Customer division deleted successfully'
                ELSE 'No matching customer division found'
            END
        );

    ELSE
        RAISE EXCEPTION 'Invalid customer division mode: %', p_strmode;
    END IF;
END;
$BODY$;

ALTER PROCEDURE dbo.sp_pagecustdivision(
    character varying,
    character varying,
    character varying,
    character varying,
    character varying,
    character varying,
    character varying
)
OWNER TO postgres;
