/**
 * Copyright 2010-2017 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import java.util.HashMap;
import java.util.Map;

import org.bson.BsonType;
import org.bson.Document;
import org.bson.codecs.BsonTypeClassMap;
import org.bson.codecs.Codec;
import org.bson.codecs.DocumentCodec;
import org.bson.codecs.configuration.CodecProvider;
import org.bson.codecs.configuration.CodecRegistry;

import com.mongodb.DBObject;
import com.mongodb.DBObjectCodec;

import jdk.nashorn.api.scripting.ScriptObjectMirror;
import jdk.nashorn.internal.objects.NativeArray;
import jdk.nashorn.internal.objects.NativeBoolean;
import jdk.nashorn.internal.objects.NativeDate;
import jdk.nashorn.internal.objects.NativeNumber;
import jdk.nashorn.internal.objects.NativeRegExp;
import jdk.nashorn.internal.objects.NativeString;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;

/**
 * Provides codecs for Nashorn types that require access to a
 * {@link CodecRegistry} and {@link BsonTypeClassMap}.
 * 
 * @author Tal Liron
 */
public class NashornCodecProvider implements CodecProvider
{
	//
	// Construction
	//

	/**
	 * Constructor.
	 */
	public NashornCodecProvider()
	{
		Map<BsonType, Class<?>> replacements = new HashMap<BsonType, Class<?>>();
		replacements.put( BsonType.ARRAY, NativeArray.class );
		replacements.put( BsonType.BOOLEAN, NativeBoolean.class );
		replacements.put( BsonType.DATE_TIME, NativeDate.class );
		replacements.put( BsonType.DOCUMENT, ScriptObject.class );
		replacements.put( BsonType.DOUBLE, NativeNumber.class );
		replacements.put( BsonType.REGULAR_EXPRESSION, NativeRegExp.class );
		replacements.put( BsonType.STRING, NativeString.class );
		replacements.put( BsonType.UNDEFINED, Undefined.class );
		bsonTypeClassMap = new BsonTypeClassMap( replacements );
	}

	//
	// CodecProvider
	//

	@SuppressWarnings("unchecked")
	public <T> Codec<T> get( Class<T> clazz, CodecRegistry registry )
	{
		if( clazz == Document.class )
			return (Codec<T>) new DocumentCodec( registry, bsonTypeClassMap );
		else if( clazz == DBObject.class )
			return (Codec<T>) new DBObjectCodec( registry, bsonTypeClassMap );
		else if( clazz == NativeArray.class )
			return (Codec<T>) new NativeArrayCodec( registry, bsonTypeClassMap );
		// Nashorn uses subclasses of ScriptObject, such as JO4
		else if( ScriptObject.class.isAssignableFrom( clazz ) )
			return (Codec<T>) new ScriptObjectCodec( registry, bsonTypeClassMap );
		else if( clazz == ScriptObjectMirror.class )
			return (Codec<T>) new ScriptObjectMirrorCodec( registry );
		return null;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final BsonTypeClassMap bsonTypeClassMap;
}
